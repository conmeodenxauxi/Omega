import fetch from "node-fetch";
import { BlockchainType } from "@shared/schema";

interface BalanceResponse {
  success: boolean;
  balance: string;
  error?: string;
}

// Define API endpoints for various blockchain balance checks
const BLOCKCHAIN_APIS = {
  BTC: [
    // Multiple APIs for fallback
    (address: string) => `https://blockchain.info/balance?active=${address}`,
    (address: string) => `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`,
  ],
  ETH: [
    (address: string) => `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest`,
    (address: string) => `https://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey`,
  ],
  BSC: [
    (address: string) => `https://api.bscscan.com/api?module=account&action=balance&address=${address}&tag=latest`,
  ],
  SOL: [
    (address: string) => `https://api.mainnet-beta.solana.com`,
  ],
  DOGE: [
    (address: string) => `https://dogechain.info/api/v1/address/balance/${address}`,
    (address: string) => `https://api.blockcypher.com/v1/doge/main/addrs/${address}/balance`,
  ],
};

// Parse balance responses based on blockchain type
async function parseBalanceResponse(
  blockchain: BlockchainType,
  address: string,
  response: any
): Promise<BalanceResponse> {
  try {
    switch (blockchain) {
      case "BTC":
        if (response[address]?.final_balance !== undefined) {
          // Blockchain.info format
          return {
            success: true,
            balance: (response[address].final_balance / 100000000).toString(),
          };
        } else if (response.balance !== undefined) {
          // Blockcypher format
          return {
            success: true,
            balance: (response.balance / 100000000).toString(),
          };
        }
        break;
      case "ETH":
        if (response.result !== undefined) {
          // Etherscan format
          return {
            success: true,
            balance: (parseInt(response.result) / 1e18).toString(),
          };
        } else if (response.ETH?.balance !== undefined) {
          // Ethplorer format
          return {
            success: true,
            balance: response.ETH.balance.toString(),
          };
        }
        break;
      case "BSC":
        if (response.result !== undefined) {
          return {
            success: true,
            balance: (parseInt(response.result) / 1e18).toString(),
          };
        }
        break;
      case "SOL":
        // SOL requires a POST request with a specific payload
        return {
          success: true,
          balance: response?.result?.value?.toString() || "0",
        };
        break;
      case "DOGE":
        if (response.balance !== undefined) {
          // Dogechain.info format
          return {
            success: true,
            balance: response.balance,
          };
        } else if (response.final_balance !== undefined) {
          // Blockcypher format
          return {
            success: true,
            balance: (response.final_balance / 100000000).toString(),
          };
        }
        break;
    }

    return { success: false, balance: "0", error: "Invalid response format" };
  } catch (error) {
    return { success: false, balance: "0", error: String(error) };
  }
}

// Make specialized request for Solana using JSON-RPC
async function getSolanaBalance(address: string): Promise<BalanceResponse> {
  try {
    const response = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address],
      }),
    });

    const data = await response.json();
    if (data.result?.value !== undefined) {
      return {
        success: true,
        balance: (data.result.value / 1e9).toString(), // Convert lamports to SOL
      };
    }

    return { success: false, balance: "0", error: "Invalid response" };
  } catch (error) {
    return { success: false, balance: "0", error: String(error) };
  }
}

// Check balance with fallback across multiple APIs
export async function checkBalance(
  blockchain: BlockchainType,
  address: string
): Promise<BalanceResponse> {
  if (blockchain === "SOL") {
    return getSolanaBalance(address);
  }

  const apiUrls = BLOCKCHAIN_APIS[blockchain];
  
  // Try each API endpoint until we get a successful response
  for (const getUrl of apiUrls) {
    try {
      const url = getUrl(address);
      const response = await fetch(url);
      
      if (!response.ok) {
        continue; // Try the next API if this one fails
      }
      
      const data = await response.json();
      const result = await parseBalanceResponse(blockchain, address, data);
      
      if (result.success) {
        return result;
      }
    } catch (error) {
      console.error(`Error checking balance for ${blockchain} address ${address}:`, error);
      // Continue to the next API
    }
  }
  
  // If all APIs fail, return error
  return { success: false, balance: "0", error: "All APIs failed" };
}

// Cache to avoid duplicate balance checks
const balanceCache = new Map<string, string>();

export function getCachedBalance(blockchain: BlockchainType, address: string): string | null {
  const key = `${blockchain}:${address}`;
  return balanceCache.get(key) || null;
}

export function setCachedBalance(blockchain: BlockchainType, address: string, balance: string): void {
  const key = `${blockchain}:${address}`;
  balanceCache.set(key, balance);
}
