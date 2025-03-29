import { BlockchainType } from '@shared/schema';
import { LucideIcon } from 'lucide-react';

/**
 * Địa chỉ ví trên một blockchain
 */
export interface WalletAddress {
  blockchain: BlockchainType;
  type?: string;
  batchNumber: number;
  addresses: string[];
}

/**
 * Ví với số dư dương
 */
export interface WalletWithBalance {
  blockchain: BlockchainType;
  address: string;
  balance: string;
  seedPhrase: string;
  source?: 'manual' | 'auto'; // Nguồn của ví: kiểm tra thủ công hoặc tự động
}

/**
 * Thống kê kiểm tra ví
 */
export interface WalletCheckStats {
  created: number;
  checked: number;
  withBalance: number;
}

/**
 * Icon cho blockchain
 */
export interface BlockchainIcon {
  id: BlockchainType;
  icon: LucideIcon;
  name: string;
}