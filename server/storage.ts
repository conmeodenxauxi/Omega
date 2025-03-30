import { BlockchainType } from "@shared/schema";

// Tất cả các hoạt động database đã bị xóa vì lý do bảo mật
// Các phương thức dưới đây chỉ là stub và không thực sự lưu trữ dữ liệu

// Định nghĩa các kiểu dữ liệu tạm thời để thay thế
interface User {
  id: number;
  username: string;
}

interface InsertUser {
  username: string;
  password: string;
}

interface Wallet {
  id: number;
  blockchain: BlockchainType;
  address: string;
  balance: string;
  seedPhrase: string;
  path?: string;
  metadata?: any;
}

interface InsertWallet {
  blockchain: BlockchainType;
  address: string;
  balance: string;
  seedPhrase: string;
  path?: string;
  metadata?: any;
}

interface ManualSeedPhrase {
  id: number;
  seedPhrase: string;
  hasBeenChecked: boolean;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Wallet operations
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  
  // Manual seed phrase operations
  saveManualSeedPhrase(seedPhrase: string): Promise<ManualSeedPhrase>;
  getAllManualSeedPhrases(): Promise<ManualSeedPhrase[]>;
}

// Triển khai lớp lưu trữ không thực sự lưu trữ dữ liệu
export class MemoryStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    console.log("getUser called (no data actually stored)");
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    console.log("getUserByUsername called (no data actually stored)");
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.log("createUser called (no data actually stored)");
    return {
      id: 1,
      username: insertUser.username
    };
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    console.log(`createWallet called for blockchain: ${insertWallet.blockchain}, address: ${insertWallet.address} (no data actually stored)`);
    return {
      id: 1,
      ...insertWallet
    };
  }
  
  async saveManualSeedPhrase(seedPhrase: string): Promise<ManualSeedPhrase> {
    console.log("saveManualSeedPhrase called (no data actually stored)");
    return {
      id: 1,
      seedPhrase,
      hasBeenChecked: true
    };
  }
  
  async getAllManualSeedPhrases(): Promise<ManualSeedPhrase[]> {
    console.log("getAllManualSeedPhrases called (no data actually stored)");
    return [];
  }
}

export const storage = new MemoryStorage();
