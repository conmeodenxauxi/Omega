import { BlockchainType } from "@shared/schema";
import { LucideIcon } from "lucide-react";

export interface WalletAddress {
  blockchain: BlockchainType;
  type?: string;
  batchNumber: number;
  addresses: string[];
}

export interface WalletWithBalance {
  blockchain: BlockchainType;
  address: string;
  balance: string;
  seedPhrase: string;
}

export interface WalletCheckStats {
  created: number;
  checked: number;
  withBalance: number;
}

export interface BlockchainIcon {
  id: BlockchainType;
  icon: LucideIcon;
  name: string;
}
