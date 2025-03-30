import { BlockchainType } from "@shared/schema";
import fetch, { RequestInit } from "node-fetch";
import { getApiConfigs } from "./api-keys";

// Cache để lưu trữ kết quả kiểm tra số dư với timestamp
const balanceCache = new Map<string, { balance: string, timestamp: number }>();

// Thời gian cache (1 giờ)
const CACHE_TTL = 60 * 60 * 1000;

// Cache cho request đang chờ để tránh duplicate requests
const pendingRequests = new Map<string, Promise<string>>();

// Thời gian timeout cho các API request
const API_TIMEOUT = 5000;

// Circuit breaker để tránh quá nhiều request lỗi
class CircuitBreaker {
  private failures: Map<string, number> = new Map();
  private lastCheck: Map<string, number> = new Map();
  private readonly threshold = 3;
  private readonly resetTime = 60 * 1000; // 1 phút

  public canRequest(service: string): boolean {
    const failures = this.failures.get(service) || 0;
    const lastCheck = this.lastCheck.get(service) || 0;
    const now = Date.now();

    if (failures >= this.threshold) {
      if (now - lastCheck > this.resetTime) {
        // Reset sau thời gian cố định
        this.failures.set(service, 0);
        return true;
      }
      return false;
    }
    return true;
  }

  public recordFailure(service: string): void {
    const failures = this.failures.get(service) || 0;
    this.failures.set(service, failures + 1);
    this.lastCheck.set(service, Date.now());
  }

  public recordSuccess(service: string): void {
    this.failures.set(service, 0);
  }
}

const circuitBreakerManager = new CircuitBreaker();

// Promise với timeout
const timeoutPromise = (ms: number) => {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timed out')), ms);
  });
};

// Định dạng kết quả kiểm tra số dư
interface BalanceResponse {
  success: boolean;
  balance: string;
  error?: string;
}

/**
 * Kiểm tra số dư cho một địa chỉ blockchain với chiến lược xoay vòng API thông minh
 */
export async function checkBalanceWithSmartRotation(
  blockchain: BlockchainType,
  address: string
): Promise<string> {
  // Kiểm tra cache trước
  const cacheKey = `${blockchain}:${address}`;
  const cachedBalance = getCachedBalance(blockchain, address);
  if (cachedBalance) {
    console.log(`Using cached balance for ${blockchain}:${address}: ${cachedBalance}`);
    return cachedBalance;
  }
  
  // Kiểm tra xem có request đang chờ không
  let pendingRequest = pendingRequests.get(cacheKey);
  if (pendingRequest) {
    console.log(`Reusing pending request for ${blockchain}:${address}`);
    return pendingRequest;
  }
  
  // Kiểm tra circuit breaker
  if (!circuitBreakerManager.canRequest(blockchain.toLowerCase())) {
    console.log(`Circuit breaker open for ${blockchain}. Skipping request.`);
    return '0';
  }
  
  // Tạo mới request và lưu vào danh sách đang chờ
  pendingRequest = (async () => {
    try {
      console.log(`Checking ${blockchain} balance for ${address} using smart rotation API`);
      
      // Lấy tất cả các cấu hình API cho blockchain này
      const apiConfigs = getApiConfigs(blockchain, address);
      
      if (!apiConfigs || apiConfigs.length === 0) {
        throw new Error(`No API configs available for ${blockchain}`);
      }
      
      // Tạo các promise từ các cấu hình API
      const apiPromises = apiConfigs.map(config => {
        return fetch(config.url, {
          method: config.method,
          headers: config.headers,
          body: config.body
        })
          .then(async res => {
            try {
              const data = await res.json();
              let balance = '0';
              let success = false;
              
              // Xử lý phản hồi tùy theo blockchain và API provider
              switch (blockchain) {
                case 'BTC':
                  if (config.name.includes('BlockCypher')) {
                    const bcData = data as any;
                    if (bcData && typeof bcData.balance !== 'undefined') {
                      balance = (bcData.balance / 100000000).toFixed(8);
                      success = true;
                    }
                  } else if (config.name === 'GetBlock') {
                    const gbData = data as any;
                    if (gbData && gbData.balance) {
                      balance = (parseInt(gbData.balance) / 100000000).toFixed(8);
                      success = true;
                    }
                  } else if (config.name === 'Blockchair') {
                    const bcData = data as any;
                    if (bcData?.data?.[address]?.address?.balance) {
                      balance = (bcData.data[address].address.balance / 100000000).toFixed(8);
                      success = true;
                    }
                  } else if (config.name.includes('Blockchain.info')) {
                    const biData = data as any;
                    if (biData?.[address]?.final_balance !== undefined) {
                      balance = (biData[address].final_balance / 100000000).toFixed(8);
                      success = true;
                    }
                  } else if (config.name.includes('Blockstream') || config.name.includes('Mempool')) {
                    const bsData = data as any;
                    if (bsData?.chain_stats?.funded_txo_sum !== undefined && 
                        bsData?.chain_stats?.spent_txo_sum !== undefined) {
                      const funded = bsData.chain_stats.funded_txo_sum;
                      const spent = bsData.chain_stats.spent_txo_sum;
                      balance = ((funded - spent) / 100000000).toFixed(8);
                      success = true;
                    }
                  } else if (config.name.includes('SoChain')) {
                    const scData = data as any;
                    if (scData?.status === 'success' && scData?.data?.confirmed_balance) {
                      balance = parseFloat(scData.data.confirmed_balance).toFixed(8);
                      success = true;
                    }
                  } else if (config.name === 'BTC_Tatum') {
                    const tatumData = data as any;
                    // Tính toán số dư từ API Tatum cho BTC: incoming - outgoing
                    if (tatumData?.incoming !== undefined && tatumData?.outgoing !== undefined) {
                      const incoming = parseFloat(tatumData.incoming);
                      const outgoing = parseFloat(tatumData.outgoing);
                      balance = (incoming - outgoing).toFixed(8);
                      success = true;
                    }
                  }
                  break;
                
                case 'ETH':
                  if (config.name.includes('Etherscan')) {
                    const esData = data as any;
                    if (esData?.status === '1' && esData?.result) {
                      balance = (Number(BigInt(esData.result)) / 1e18).toFixed(18);
                      success = true;
                    }
                  }
                  break;
                
                case 'BSC':
                  if (config.name.includes('BSCScan')) {
                    const bscData = data as any;
                    if (bscData?.status === '1' && bscData?.result) {
                      balance = (Number(BigInt(bscData.result)) / 1e18).toFixed(18);
                      success = true;
                    }
                  }
                  break;
                
                case 'SOL':
                  if (config.name === 'Solana RPC') {
                    const solData = data as any;
                    if (solData?.result?.value !== undefined) {
                      balance = (solData.result.value / 1e9).toFixed(9);
                      success = true;
                    }
                  } else if (config.name === 'Helius') {
                    const helData = data as any;
                    if (helData && typeof helData.nativeBalance !== 'undefined') {
                      balance = (helData.nativeBalance / 1e9).toFixed(9);
                      success = true;
                    }
                  }
                  break;
                
                case 'DOGE':
                  if (config.name === 'Tatum') {
                    const tatumData = data as any;
                    // Tính toán số dư từ API Tatum: incoming - outgoing
                    if (tatumData?.incoming !== undefined && tatumData?.outgoing !== undefined) {
                      const incoming = parseFloat(tatumData.incoming);
                      const outgoing = parseFloat(tatumData.outgoing);
                      balance = (incoming - outgoing).toFixed(8);
                      success = true;
                    }
                  }
                  break;
              }
              
              if (success) {
                console.log(`${config.name} balance for ${blockchain}:${address}: ${balance}`);
                return { success, balance };
              }
              
              console.error(`Unexpected response from ${config.name} for ${blockchain}:`, data);
              throw new Error(`Unexpected response from ${config.name}`);
            } catch (error) {
              console.error(`Error processing ${config.name} response:`, error);
              throw error;
            }
          })
          .catch(err => {
            console.error(`${config.name} API failed:`, err.message);
            return { success: false, balance: '0', error: err.message };
          });
      });
      
      // Race promises để lấy kết quả từ API phản hồi nhanh nhất
      const result = await Promise.race([
        Promise.any(apiPromises),
        timeoutPromise(API_TIMEOUT)
      ]);
      
      if (result && result.success && result.balance) {
        // Parse kết quả và lưu vào cache
        const balance = parseBalanceResponse(blockchain, result.balance);
        
        if (parseFloat(balance) > 0) {
          console.log(`Found positive balance for ${blockchain}:${address}: ${balance}`);
          setCachedBalance(blockchain, address, balance);
        }
        
        circuitBreakerManager.recordSuccess(blockchain.toLowerCase());
        return balance;
      }
      
      throw new Error('All API requests failed');
    } catch (error) {
      console.error(`Error checking balance for ${blockchain}:${address}:`, error);
      circuitBreakerManager.recordFailure(blockchain.toLowerCase());
      return '0';
    } finally {
      // Đảm bảo xóa khỏi danh sách chờ nếu không có cache
      if (!balanceCache.has(cacheKey)) {
        pendingRequests.delete(cacheKey);
      }
    }
  })();
  
  // Lưu promise vào danh sách đang chờ
  pendingRequests.set(cacheKey, pendingRequest);
  return pendingRequest;
}

/**
 * Parse và định dạng số dư theo loại blockchain
 */
function parseBalanceResponse(blockchain: BlockchainType, balance: string): string {
  try {
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) return '0';
    
    // Format số dư theo loại blockchain
    switch (blockchain) {
      case 'BTC':
        return numBalance.toFixed(8);
      case 'ETH':
      case 'BSC':
        return numBalance.toFixed(18);
      case 'SOL':
        return numBalance.toFixed(9);
      case 'DOGE':
        return numBalance.toFixed(8);
      default:
        return numBalance.toString();
    }
  } catch (error) {
    console.error(`Error parsing balance for ${blockchain}:`, error);
    return '0';
  }
}

// Lấy số dư từ cache
function getCachedBalance(blockchain: BlockchainType, address: string): string | null {
  const cacheKey = `${blockchain}:${address}`;
  const cacheEntry = balanceCache.get(cacheKey);
  
  if (cacheEntry) {
    const now = Date.now();
    // Kiểm tra xem cache có còn hiệu lực không
    if (now - cacheEntry.timestamp < CACHE_TTL) {
      return cacheEntry.balance;
    } else {
      // Cache đã hết hạn, xóa đi
      balanceCache.delete(cacheKey);
    }
  }
  
  // Kiểm tra xem có request đang chờ xử lý không
  const pendingRequest = pendingRequests.get(cacheKey);
  if (pendingRequest) {
    console.log(`Using pending request for ${blockchain}:${address}`);
    return null; // Trả về null để biết rằng cần đợi kết quả request đang chờ
  }
  
  return null;
}

// Lưu số dư vào cache
function setCachedBalance(blockchain: BlockchainType, address: string, balance: string): void {
  const cacheKey = `${blockchain}:${address}`;
  const now = Date.now();
  
  // Lưu vào cache với timestamp
  balanceCache.set(cacheKey, { 
    balance, 
    timestamp: now 
  });
  
  // Xóa khỏi danh sách đang chờ
  pendingRequests.delete(cacheKey);
}