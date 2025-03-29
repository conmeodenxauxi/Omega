import { users, wallets, type User, type InsertUser, type Wallet, type InsertWallet } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const [wallet] = await db
      .insert(wallets)
      .values(insertWallet)
      .returning();
    return wallet;
  }

  async getWalletsWithBalance(): Promise<Wallet[]> {
    return await db.select().from(wallets);
  }
}

export const storage = new DatabaseStorage();
