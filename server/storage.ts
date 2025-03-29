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
    // Insert without explicit createdAt, SQLite will add timestamp
    const result = await db
      .insert(wallets)
      .values({
        blockchain: insertWallet.blockchain,
        address: insertWallet.address,
        balance: insertWallet.balance,
        seedPhrase: insertWallet.seedPhrase,
        path: insertWallet.path,
        metadata: insertWallet.metadata,
        createdAt: Math.floor(Date.now() / 1000) // Unix timestamp in seconds
      });
    
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
}

export const storage = new DatabaseStorage();
