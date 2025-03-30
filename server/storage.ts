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
      // Kiểm tra xem địa chỉ đã tồn tại trong cơ sở dữ liệu chưa với cùng seed phrase
      const existingWallets = await db.select()
        .from(wallets)
        .where(
          eq(wallets.address, wallet.address)
        );
      
      // Nếu đã tồn tại với cùng seed phrase, cập nhật số dư thay vì thêm mới
      if (existingWallets.length > 0 && existingWallets.some(w => w.seedPhrase === wallet.seedPhrase)) {
        const existingWallet = existingWallets.find(w => w.seedPhrase === wallet.seedPhrase);
        if (existingWallet) {
          // Chỉ cập nhật nếu là cùng blockchain
          if (existingWallet.blockchain === wallet.blockchain) {
            // Cập nhật số dư
            const result = await db.update(wallets)
              .set({
                balance: wallet.balance,
                isManualCheck: wallet.isManualCheck || existingWallet.isManualCheck
              })
              .where(eq(wallets.id, existingWallet.id))
              .returning();
            
            if (result.length > 0) {
              return result[0];
            }
            return existingWallet;
          }
        }
      }
      
      // Nếu không tồn tại hoặc khác seed phrase, thêm mới
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
  
  // Lấy tất cả ví từ database để hiển thị trong admin panel
  async getWalletsWithBalance(): Promise<Wallet[]> {
    // Lấy tất cả các ví, bao gồm cả ví kiểm tra thủ công và tự động
    return db.select().from(wallets);
  }
}

export const storage = new DatabaseStorage();
