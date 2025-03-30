import { users, wallets, seedPhrases, type User, type InsertUser, type Wallet, type InsertWallet, type InsertSeedPhrase, type SeedPhrase } from "@shared/schema";
import { db } from "./db";
import { eq, gt } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Wallet operations
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  getWalletsWithBalance(): Promise<Wallet[]>;
  
  // Seed phrase operations
  saveSeedPhrase(seedPhrase: string): Promise<SeedPhrase>;
  getSeedPhrases(): Promise<SeedPhrase[]>;
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
      source: insertWallet.source || "auto", // Mặc định là "auto" nếu không được cung cấp
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
  
  async saveSeedPhrase(seedPhrase: string): Promise<SeedPhrase> {
    try {
      // Kiểm tra xem seed phrase đã tồn tại chưa
      const existingPhrases = await db
        .select()
        .from(seedPhrases)
        .where(eq(seedPhrases.seedPhrase, seedPhrase));
      
      // Nếu đã tồn tại, trả về seed phrase đó
      if (existingPhrases.length > 0) {
        return existingPhrases[0];
      }
      
      // Nếu chưa tồn tại, thêm vào database
      await db
        .insert(seedPhrases)
        .values({ seedPhrase });
      
      // Lấy seed phrase vừa thêm
      const newPhrases = await db
        .select()
        .from(seedPhrases)
        .where(eq(seedPhrases.seedPhrase, seedPhrase));
      
      return newPhrases[0];
    } catch (error) {
      console.error("Lỗi khi lưu seed phrase:", error);
      throw error;
    }
  }
  
  async getSeedPhrases(): Promise<SeedPhrase[]> {
    return await db
      .select()
      .from(seedPhrases);
  }
}

export const storage = new DatabaseStorage();
