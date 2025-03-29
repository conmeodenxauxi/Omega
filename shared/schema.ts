import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  blockchain: text("blockchain").notNull(), // "BTC", "ETH", "BSC", "SOL", "DOGE"
  address: text("address").notNull(),
  balance: text("balance").notNull(), // Store as string to maintain precision
  seedPhrase: text("seed_phrase").notNull(),
  path: text("derivation_path"),
  createdAt: timestamp("created_at").defaultNow(),
  metadata: jsonb("metadata"), // For additional blockchain-specific data
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  blockchain: true,
  address: true,
  balance: true,
  seedPhrase: true,
  path: true,
  metadata: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

// Custom types for the application
export type BlockchainType = "BTC" | "ETH" | "BSC" | "SOL" | "DOGE";

export const blockchainSchema = z.enum(["BTC", "ETH", "BSC", "SOL", "DOGE"]);
export const seedPhraseSchema = z.string().refine(
  (phrase) => {
    const words = phrase.trim().split(/\s+/);
    return words.length === 12 || words.length === 24;
  },
  {
    message: "Seed phrase must have 12 or 24 words",
  }
);
