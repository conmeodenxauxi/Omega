import { users, wallets, manualSeedPhrases, type User, type InsertUser, type Wallet, type InsertWallet, type InsertManualSeedPhrase, type ManualSeedPhrase } from "@shared/schema";
import { db } from "./db";
import { eq, gt } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Wallet operations
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  getWalletsWithBalance(): Promise<Wallet[]>;
  
  // Manual seed phrase operations
  saveManualSeedPhrase(seedPhrase: string): Promise<ManualSeedPhrase>;
  getAllManualSeedPhrases(): Promise<ManualSeedPhrase[]>;
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
  
  async saveManualSeedPhrase(seedPhrase: string): Promise<ManualSeedPhrase> {
    // Lưu seed phrase vào bảng manual_seed_phrases
    const data = {
      seedPhrase: seedPhrase,
      hasBeenChecked: true,
    };
    
    // Lưu vào database
    await db
      .insert(manualSeedPhrases)
      .values(data);
    
    // Lấy bản ghi vừa tạo
    const result = await db
      .select()
      .from(manualSeedPhrases)
      .where(eq(manualSeedPhrases.seedPhrase, seedPhrase))
      .limit(1);
    
    // Trả về bản ghi đầu tiên
    return result[0];
  }
  
  async getAllManualSeedPhrases(): Promise<ManualSeedPhrase[]> {
    // Lấy tất cả các seed phrase thủ công
    return await db
      .select()
      .from(manualSeedPhrases);
  }
}

export const storage = new DatabaseStorage();
