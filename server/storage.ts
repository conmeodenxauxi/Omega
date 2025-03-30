import { BlockchainType, InsertWallet, Wallet, wallets } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // Wallet operations
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  
  // Manual seed phrase operations
  saveManualSeedPhrase(seedPhrase: string): Promise<Wallet>;
  getAllManualSeedPhrases(): Promise<Wallet[]>;
  
  // Wallet query
  getWalletsWithBalance(): Promise<Wallet[]>;
}

// Triển khai lớp lưu trữ sử dụng Drizzle ORM với SQLite
export class DatabaseStorage implements IStorage {
  // Lưu trữ ví vào database, bao gồm cả ví từ kiểm tra tự động và kiểm tra thủ công
  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    try {
      // Thêm vào database
      const result = await db.insert(wallets).values({
        blockchain: wallet.blockchain,
        address: wallet.address,
        balance: wallet.balance,
        seedPhrase: wallet.seedPhrase,
        path: wallet.path || "",
        isManualCheck: wallet.isManualCheck || false,
        metadata: wallet.metadata || {}
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw error;
    }
  }
  
  // Lưu seed phrase thủ công vào database với trạng thái isManualCheck = true
  async saveManualSeedPhrase(seedPhrase: string): Promise<Wallet> {
    // Lưu seed phrase như một ví với blockchain="MANUAL", address="UNCHECKED"
    return this.createWallet({
      blockchain: "MANUAL" as BlockchainType, // Kiểu ảo, không thực sự có blockchain này
      address: "MANUAL_ENTRY",
      balance: "0",
      seedPhrase: seedPhrase,
      path: "",
      isManualCheck: true,
      metadata: {}
    });
  }
  
  // Lấy tất cả seed phrase thủ công từ database
  async getAllManualSeedPhrases(): Promise<Wallet[]> {
    return db.select().from(wallets).where(eq(wallets.isManualCheck, true));
  }
  
  // Lấy tất cả ví có số dư từ database
  async getWalletsWithBalance(): Promise<Wallet[]> {
    // Chỉ lấy các ví có số dư > 0
    return db.select().from(wallets).where(
      // Loại bỏ các ví "MANUAL" không thực sự có blockchain
      eq(wallets.blockchain, "BTC")
    );
  }
}

export const storage = new DatabaseStorage();
