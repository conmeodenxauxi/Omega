import { BlockchainType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { WalletAddress, WalletWithBalance } from "@/types";

/**
 * Check balances for a list of wallet addresses
 */
export async function checkBalances(
  addresses: WalletAddress[]
): Promise<WalletWithBalance[]> {
  try {
    const response = await apiRequest(
      "POST", 
      "/api/check-balances", 
      { addresses }
    );
    
    return await response.json();
  } catch (error) {
    console.error("Error checking balances:", error);
    return [];
  }
}

/**
 * Generate addresses from a seed phrase for specified blockchains
 */
export async function generateAddressesFromSeed(
  seedPhrase: string, 
  blockchains: BlockchainType[]
): Promise<WalletAddress[]> {
  try {
    const response = await apiRequest(
      "POST", 
      "/api/generate-addresses", 
      { 
        seedPhrase,
        blockchains
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error("Error generating addresses:", error);
    return [];
  }
}

/**
 * Check if a wallet address is valid based on blockchain type
 */
export function isValidAddress(blockchain: BlockchainType, address: string): boolean {
  const patterns = {
    BTC: /^(1|3|bc1)[a-zA-Z0-9]{25,42}$/,
    ETH: /^0x[a-fA-F0-9]{40}$/,
    BSC: /^0x[a-fA-F0-9]{40}$/,
    SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    DOGE: /^D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}$/
  };
  
  return patterns[blockchain].test(address);
}
