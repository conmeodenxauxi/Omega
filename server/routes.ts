import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as walletGenerator from "./blockchain/wallets";
import { checkBalance, getCachedBalance, setCachedBalance } from "./blockchain/api";
import { BlockchainType, blockchainSchema, seedPhraseSchema, wallets } from "@shared/schema";
import { z } from "zod";
import { WalletAddress } from "../client/src/types";

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
      const addresses = await walletGenerator.generateAddressesFromSeedPhrase(
        seedPhrase,
        blockchains
      );

      return res.json(addresses);
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
            batchNumber: z.number(),
            addresses: z.array(z.string()),
            type: z.string().optional(),
          })
        ),
      });

      const validationResult = schema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request",
          errors: validationResult.error.errors,
        });
      }

      const { addresses } = validationResult.data;
      const walletsWithBalance = [];

      // Check balances for all addresses
      for (const addressGroup of addresses) {
        const { blockchain, addresses: addressList } = addressGroup;

        for (const address of addressList) {
          // Check if we already have a cached balance
          const cachedBalance = getCachedBalance(blockchain, address);
          
          if (cachedBalance) {
            // If balance > 0, add to result
            if (parseFloat(cachedBalance) > 0) {
              walletsWithBalance.push({
                blockchain,
                address,
                balance: cachedBalance,
                seedPhrase: req.body.seedPhrase || "Unknown",
              });
            }
            continue;
          }

          // Check balance from APIs
          const balanceResult = await checkBalance(blockchain, address);

          // Cache the result
          setCachedBalance(blockchain, address, balanceResult.balance);

          // If balance > 0, add to result
          if (balanceResult.success && parseFloat(balanceResult.balance) > 0) {
            walletsWithBalance.push({
              blockchain,
              address,
              balance: balanceResult.balance,
              seedPhrase: req.body.seedPhrase || "Unknown",
            });
            
            // Save to database if we have a balance > 0
            try {
              await storage.createWallet({
                blockchain,
                address,
                balance: balanceResult.balance,
                seedPhrase: req.body.seedPhrase || "Unknown",
                path: "",
                metadata: {},
              });
            } catch (dbError) {
              console.error("Error saving wallet to database:", dbError);
              // Continue even if DB save fails
            }
          }
        }
      }

      return res.json(walletsWithBalance);
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
      return res.json(walletsWithBalance);
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
