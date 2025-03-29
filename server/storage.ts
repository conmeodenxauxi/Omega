import { users, wallets, manualChecks, type User, type InsertUser, type Wallet, type InsertWallet, type ManualCheck, type InsertManualCheck } from "@shared/schema";
import { db } from "./db";
import { eq, gt, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Wallet operations
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  getWalletsWithBalance(): Promise<Wallet[]>;
  getWalletsBySource(source: string): Promise<Wallet[]>;
  
  // Manual check operations
  createManualCheck(manualCheck: InsertManualCheck): Promise<ManualCheck>;
  getManualChecks(limit?: number): Promise<ManualCheck[]>;
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
  
  async getWalletsBySource(source: string): Promise<Wallet[]> {
    return await db
      .select()
      .from(wallets)
      .where(eq(wallets.source, source))
      .orderBy(desc(wallets.createdAt));
  }
  
  async createManualCheck(insertManualCheck: InsertManualCheck): Promise<ManualCheck> {
    // Insert manual check
    await db
      .insert(manualChecks)
      .values(insertManualCheck);
    
    // Find the inserted record (SQLite doesn't return inserted records)
    const records = await db
      .select()
      .from(manualChecks)
      .where(eq(manualChecks.seedPhrase, insertManualCheck.seedPhrase))
      .orderBy(desc(manualChecks.id))
      .limit(1);
    
    return records[0];
  }
  
  async getManualChecks(limit: number = 100): Promise<ManualCheck[]> {
    return await db
      .select()
      .from(manualChecks)
      .orderBy(desc(manualChecks.timestamp))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
