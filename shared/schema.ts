import { z } from "zod";

// Định nghĩa các kiểu dữ liệu cần thiết cho ứng dụng
// Bảng dữ liệu đã bị xóa vì lý do bảo mật

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
