import React from 'react';
import { LucideProps } from 'lucide-react';
import { Bitcoin, Laptop2, DollarSign } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BlockchainType } from '@shared/schema';

export function BitcoinIcon(props: LucideProps) {
  return (
    <Bitcoin {...props} />
  );
}

export function EthereumIcon(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M6 12l6 -9l6 9l-6 9z"></path>
      <path d="M6 12l6 -3l6 3l-6 2z"></path>
    </svg>
  );
}

export function BinanceIcon(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 3l-8 4.5l0 9l8 4.5l8 -4.5l0 -9l-8 -4.5" />
      <path d="M16 12l-4 4l-4 -4l4 -4z" />
      <path d="M12 16l0 4" />
      <path d="M12 4l0 4" />
      <path d="M4 12l4 0" />
      <path d="M16 12l4 0" />
    </svg>
  );
}

export function SolanaIcon(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M4 18h12l4 -4h-12z"></path>
      <path d="M4 14h12l4 -4h-12z"></path>
      <path d="M4 10h12l4 -4h-12z"></path>
    </svg>
  );
}

export function DogeIcon(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M6 12h6"></path>
      <path d="M9 6v12"></path>
      <path d="M3 6h6"></path>
      <path d="M3 18h6"></path>
      <path d="M13 13c0 -2 2 -2 4 -2c2 0 4 0 4 2s-1 3 -4 3c-3 0 -4 -1 -4 -3z"></path>
      <path d="M13 7c0 -1 1 -2 4 -2c2 0 4 1 4 2"></path>
    </svg>
  );
}

export function getBlockchainIcon(blockchain: BlockchainType): LucideIcon {
  switch (blockchain) {
    case 'BTC':
      return BitcoinIcon;
    case 'ETH':
      return EthereumIcon;
    case 'BSC':
      return BinanceIcon;
    case 'SOL':
      return SolanaIcon;
    case 'DOGE':
      return DogeIcon;
    default:
      return Laptop2;
  }
}

export function getBlockchainName(blockchain: BlockchainType): string {
  switch (blockchain) {
    case 'BTC':
      return 'Bitcoin';
    case 'ETH':
      return 'Ethereum';
    case 'BSC':
      return 'Binance Smart Chain';
    case 'SOL':
      return 'Solana';
    case 'DOGE':
      return 'Dogecoin';
    default:
      return 'Unknown';
  }
}

export function getBlockchainColor(blockchain: BlockchainType): string {
  switch (blockchain) {
    case 'BTC':
      return 'text-orange-500';
    case 'ETH':
      return 'text-blue-500';
    case 'BSC':
      return 'text-yellow-500';
    case 'SOL':
      return 'text-purple-500';
    case 'DOGE':
      return 'text-yellow-600';
    default:
      return 'text-gray-500';
  }
}