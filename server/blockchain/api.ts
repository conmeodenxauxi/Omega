import { BlockchainType } from "@shared/schema";
import fetch, { RequestInit } from "node-fetch";
import { getApiKey } from "./api-keys";

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

// Rotation của API keys
let serviceKeyIndex: Record<string, number> = {};

// Định dạng kết quả kiểm tra số dư
interface BalanceResponse {
  success: boolean;
  balance: string;
  error?: string;
}

// API cho Bitcoin
const getBTCBalance = async (address: string): Promise<BalanceResponse> => {
  try {
    console.log(`Checking BTC balance for ${address} via multiple APIs`);
    
    // Danh sách API để kiểm tra
    const apis = [
      // Blockchain.info
      {
        url: `https://blockchain.info/balance?active=${address}`,
        processResponse: async (res: any) => {
          const data = await res.json() as any;
          if (data && data[address] && typeof data[address].final_balance === 'number') {
            const balanceSats = data[address].final_balance;
            // Chuyển đổi từ satoshi sang BTC (1 BTC = 100,000,000 satoshi)
            const balanceBTC = (balanceSats / 100000000).toFixed(8);
            console.log(`Blockchain.info balance for ${address}: ${balanceBTC} BTC`);
            return { success: true, balance: balanceBTC };
          }
          throw new Error('Unexpected response from Blockchain.info');
        }
      },
      // Blockstream API
      {
        url: `https://blockstream.info/api/address/${address}`,
        processResponse: async (res: any) => {
          const data = await res.json() as any;
          if (data && typeof data.chain_stats?.funded_txo_sum === 'number' && typeof data.chain_stats?.spent_txo_sum === 'number') {
            const funded = data.chain_stats.funded_txo_sum;
            const spent = data.chain_stats.spent_txo_sum;
            const balanceSats = funded - spent;
            const balanceBTC = (balanceSats / 100000000).toFixed(8);
            console.log(`Blockstream balance for ${address}: ${balanceBTC} BTC`);
            return { success: true, balance: balanceBTC };
          }
          throw new Error('Unexpected response from Blockstream');
        }
      },
      // Mempool API
      {
        url: `https://mempool.space/api/address/${address}`,
        processResponse: async (res: any) => {
          const data = await res.json() as any;
          if (data && typeof data.chain_stats?.funded_txo_sum === 'number' && typeof data.chain_stats?.spent_txo_sum === 'number') {
            const funded = data.chain_stats.funded_txo_sum;
            const spent = data.chain_stats.spent_txo_sum;
            const balanceSats = funded - spent;
            const balanceBTC = (balanceSats / 100000000).toFixed(8);
            console.log(`Mempool balance for ${address}: ${balanceBTC} BTC`);
            return { success: true, balance: balanceBTC };
          }
          throw new Error('Unexpected response from Mempool');
        }
      },
      // Blockchair API
      {
        url: `https://api.blockchair.com/bitcoin/dashboards/address/${address}`,
        processResponse: async (res: any) => {
          const data = await res.json() as any;
          if (data && data.data && data.data[address] && data.data[address].address) {
            const balanceSats = data.data[address].address.balance;
            const balanceBTC = (balanceSats / 100000000).toFixed(8);
            console.log(`Blockchair balance for ${address}: ${balanceBTC} BTC`);
            return { success: true, balance: balanceBTC };
          }
          throw new Error('Unexpected response from Blockchair');
        }
      },
      // GetBlock.io API - Blockbook (REST)
      {
        url: `https://go.getblock.io/${getApiKey('BTC', 'getblock')}/api/v2/address/${address}?details=basic`,
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'GET',
        processResponse: async (res: any) => {
          try {
            const data = await res.json() as any;
            if (data && data.balance) {
              const balanceSats = parseInt(data.balance);
              const balanceBTC = (balanceSats / 100000000).toFixed(8);
              console.log(`GetBlock.io (Blockbook) balance for ${address}: ${balanceBTC} BTC`);
              return { success: true, balance: balanceBTC };
            }
            console.error('GetBlock.io response format unexpected:', data);
            throw new Error('Unexpected response from GetBlock.io Blockbook API');
          } catch (error) {
            console.error('Error processing GetBlock.io response:', error);
            throw error;
          }
        }
      },
      // BlockCypher API
      {
        url: `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`,
        processResponse: async (res: any) => {
          const data = await res.json() as any;
          if (data && typeof data.balance === 'number') {
            const balanceSats = data.balance;
            const balanceBTC = (balanceSats / 100000000).toFixed(8);
            console.log(`BlockCypher balance for ${address}: ${balanceBTC} BTC`);
            return { success: true, balance: balanceBTC };
          }
          throw new Error('Unexpected response from BlockCypher');
        }
      },
      // SoChain API
      {
        url: `https://sochain.com/api/v2/get_address_balance/BTC/${address}`,
        processResponse: async (res: any) => {
          const data = await res.json() as any;
          if (data && data.status === 'success' && data.data && data.data.confirmed_balance) {
            const balance = parseFloat(data.data.confirmed_balance);
            const balanceBTC = balance.toFixed(8);
            console.log(`SoChain balance for ${address}: ${balanceBTC} BTC`);
            return { success: true, balance: balanceBTC };
          }
          throw new Error('Unexpected response from SoChain');
        }
      },
      // Tatum API - Tạm thời vô hiệu hóa do API key không hợp lệ
      // Sẽ kích hoạt lại khi có API key hợp lệ
      /*
      {
        url: `https://api.tatum.io/v3/bitcoin/address/balance/${address}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': getApiKey('BTC', 'BTC Tatum') || ''
        },
        method: 'GET',
        processResponse: async (res: any) => {
          try {
            const data = await res.json() as any;
            if (data && typeof data.incoming === 'string' && typeof data.outgoing === 'string') {
              const incoming = BigInt(data.incoming);
              const outgoing = BigInt(data.outgoing);
              const balanceSats = Number(incoming - outgoing);
              const balanceBTC = (balanceSats / 100000000).toFixed(8);
              console.log(`Tatum balance for ${address}: ${balanceBTC} BTC`);
              return { success: true, balance: balanceBTC };
            }
            console.error('Tatum response format unexpected:', data);
            throw new Error('Unexpected response from Tatum API');
          } catch (error) {
            console.error('Error processing Tatum response:', error);
            throw error;
          }
        }
      }
      */
    ];

    // Tạo kiểu cho API
    type ApiDefinition = {
      url: string;
      headers?: Record<string, string>;
      method?: string;
      body?: string;
      processResponse: (res: any) => Promise<BalanceResponse>;
    };

    // Thực hiện các request đồng thời
    const apiPromises = apis.map((api: ApiDefinition) => {
      // Sửa kiểu cho phù hợp với node-fetch
      const options: any = {
        method: api.method || 'GET',
        headers: api.headers || { 'Content-Type': 'application/json' }
      };
      
      if (api.body) {
        options.body = api.body;
      }
      
      return fetch(api.url, options)
        .then(res => api.processResponse(res))
        .catch(err => ({ success: false, balance: '0', error: err.message }));
    });

    // Race promises để lấy kết quả từ API phản hồi nhanh nhất
    const result = await Promise.race([
      Promise.any(apiPromises),
      timeoutPromise(API_TIMEOUT)
    ]);

    return result;
  } catch (error: any) {
    circuitBreakerManager.recordFailure('btc');
    return { success: false, balance: '0', error: error.message };
  }
};

// API cho Ethereum
const getETHBalance = async (address: string): Promise<BalanceResponse> => {
  try {
    // Lấy API key từ hệ thống rotation
    const apiKey = getApiKey('ETH');
    
    // Etherscan API với API key
    const etherscanUrl = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`;
    
    console.log(`Checking ETH balance for ${address}`);
    const response = await fetch(etherscanUrl);
    const data = await response.json() as any;
    
    if (data.status === '1' && data.result) {
      // Chuyển đổi từ wei sang ETH (1 ETH = 10^18 wei)
      const balanceWei = BigInt(data.result);
      const balanceETH = (Number(balanceWei) / 1e18).toFixed(18);
      
      return { success: true, balance: balanceETH };
    }
    
    console.error('ETH API response:', data);
    throw new Error(`Failed to get ETH balance from Etherscan: ${data.message || 'Unknown error'}`);
  } catch (error: any) {
    console.error('Error in getETHBalance:', error.message);
    circuitBreakerManager.recordFailure('eth');
    return { success: false, balance: '0', error: error.message };
  }
};

// API cho BSC
const getBSCBalance = async (address: string): Promise<BalanceResponse> => {
  try {
    // Lấy API key từ hệ thống rotation
    const apiKey = getApiKey('BSC');
    
    // BSCScan API với API key
    const bscscanUrl = `https://api.bscscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`;
    
    console.log(`Checking BSC balance for ${address}`);
    const response = await fetch(bscscanUrl);
    const data = await response.json() as any;
    
    if (data.status === '1' && data.result) {
      // Chuyển đổi từ wei sang BNB (1 BNB = 10^18 wei)
      const balanceWei = BigInt(data.result);
      const balanceBNB = (Number(balanceWei) / 1e18).toFixed(18);
      
      return { success: true, balance: balanceBNB };
    }
    
    console.error('BSC API response:', data);
    throw new Error(`Failed to get BSC balance from BSCScan: ${data.message || 'Unknown error'}`);
  } catch (error: any) {
    console.error('Error in getBSCBalance:', error.message);
    circuitBreakerManager.recordFailure('bsc');
    return { success: false, balance: '0', error: error.message };
  }
};

// API cho Solana
const getSOLBalance = async (address: string): Promise<BalanceResponse> => {
  try {
    console.log(`Checking SOL balance for ${address} via multiple APIs`);
    
    // Danh sách API để kiểm tra
    const apis = [
      // Solana Public RPC
      {
        url: 'https://api.mainnet-beta.solana.com',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address]
        }),
        processResponse: async (res: any) => {
          const data = await res.json() as any;
          if (data.result && data.result.value !== undefined) {
            // Chuyển đổi từ lamports sang SOL (1 SOL = 10^9 lamports)
            const balanceLamports = data.result.value;
            const balanceSOL = (balanceLamports / 1e9).toFixed(9);
            console.log(`Solana RPC balance for ${address}: ${balanceSOL} SOL`);
            return { success: true, balance: balanceSOL };
          }
          throw new Error('Unexpected response from Solana RPC');
        }
      },
      // Helius API
      {
        url: `https://api.helius.xyz/v0/addresses/${address}/balances?api-key=${getApiKey('SOL')}`,
        processResponse: async (res: any) => {
          try {
            const data = await res.json() as any;
            if (data && data.tokens) {
              // Trích xuất số dư SOL từ phản hồi Helius
              const nativeBalance = data.nativeBalance;
              if (nativeBalance !== undefined) {
                // Chuyển đổi từ lamports sang SOL (1 SOL = 10^9 lamports)
                const balanceSOL = (nativeBalance / 1e9).toFixed(9);
                console.log(`Helius API balance for ${address}: ${balanceSOL} SOL`);
                return { success: true, balance: balanceSOL };
              }
            }
            console.error('Helius API response format unexpected:', data);
            throw new Error('Unexpected response from Helius API');
          } catch (error) {
            console.error('Error processing Helius API response:', error);
            throw error;
          }
        }
      }
    ];

    // Tạo kiểu cho API
    type ApiDefinition = {
      url: string;
      headers?: Record<string, string>;
      method?: string;
      body?: string;
      processResponse: (res: any) => Promise<BalanceResponse>;
    };
    
    // Thực hiện các request đồng thời
    const apiPromises = apis.map((api: ApiDefinition) => {
      // Sửa kiểu cho phù hợp với node-fetch
      const options: any = {
        method: api.method || 'GET',
        headers: api.headers || { 'Content-Type': 'application/json' }
      };
      
      if (api.body) {
        options.body = api.body;
      }
      
      return fetch(api.url, options)
        .then(res => api.processResponse(res))
        .catch(err => ({ success: false, balance: '0', error: err.message }));
    });
    
    // Race promises để lấy kết quả từ API phản hồi nhanh nhất
    const result = await Promise.race([
      Promise.any(apiPromises),
      timeoutPromise(API_TIMEOUT)
    ]);
    
    return result;
  } catch (error: any) {
    console.error('Error in getSOLBalance:', error.message);
    circuitBreakerManager.recordFailure('sol');
    return { success: false, balance: '0', error: error.message };
  }
};

// API cho Dogecoin
const getDOGEBalance = async (address: string): Promise<BalanceResponse> => {
  try {
    console.log(`Checking DOGE balance for ${address} via Tatum API`);
    
    // Lấy API key từ hệ thống rotation
    const apiKey = getApiKey('DOGE', 'Tatum');
    
    // Cấu hình request Tatum API
    const url = `https://api.tatum.io/v3/dogecoin/address/balance/${address}`;
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || ''
      }
    };
    
    // Thực hiện request
    const response = await fetch(url, options);
    const data = await response.json() as any;
    
    // Xử lý phản hồi
    if (data && data.incoming !== undefined && data.outgoing !== undefined) {
      // Tatum trả về incoming (nhận vào) và outgoing (gửi đi)
      // Số dư = incoming - outgoing
      const incoming = parseFloat(data.incoming);
      const outgoing = parseFloat(data.outgoing);
      const balance = (incoming - outgoing).toFixed(8);
      
      console.log(`Tatum API balance for ${address}: ${balance} DOGE (incoming: ${incoming}, outgoing: ${outgoing})`);
      return { success: true, balance };
    }
    
    console.error('Tatum API response format unexpected:', data);
    throw new Error('Unexpected response from Tatum API');
  } catch (error: any) {
    console.error('Error in getDOGEBalance:', error.message);
    circuitBreakerManager.recordFailure('doge');
    return { success: false, balance: '0', error: error.message };
  }
};

// Parse kết quả kiểm tra số dư
async function parseBalanceResponse(
  blockchain: BlockchainType,
  result: BalanceResponse
): Promise<string> {
  if (!result.success || !result.balance) {
    return '0';
  }
  
  try {
    const balance = parseFloat(result.balance);
    if (isNaN(balance)) return '0';
    
    // Format số dư theo loại blockchain
    switch (blockchain) {
      case 'BTC':
        return balance.toFixed(8);
      case 'ETH':
      case 'BSC':
        return balance.toFixed(18);
      case 'SOL':
        return balance.toFixed(9);
      case 'DOGE':
        return balance.toFixed(8);
      default:
        return balance.toString();
    }
  } catch (error) {
    console.error(`Error parsing balance for ${blockchain}:`, error);
    return '0';
  }
}

// Kiểm tra số dư cho một địa chỉ
export async function checkBalance(
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
      let result: BalanceResponse;
      
      // Thực hiện kiểm tra theo loại blockchain
      switch (blockchain) {
        case 'BTC':
          result = await getBTCBalance(address);
          break;
        case 'ETH':
          result = await getETHBalance(address);
          break;
        case 'BSC':
          result = await getBSCBalance(address);
          break;
        case 'SOL':
          result = await getSOLBalance(address);
          break;
        case 'DOGE':
          result = await getDOGEBalance(address);
          break;
        default:
          return '0';
      }
      
      // Parse kết quả và lưu vào cache
      const balance = await parseBalanceResponse(blockchain, result);
      
      if (parseFloat(balance) > 0) {
        console.log(`Found positive balance for ${blockchain}:${address}: ${balance}`);
        setCachedBalance(blockchain, address, balance);
      }
      
      circuitBreakerManager.recordSuccess(blockchain.toLowerCase());
      return balance;
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

// Lấy số dư từ cache
export function getCachedBalance(blockchain: BlockchainType, address: string): string | null {
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
export function setCachedBalance(blockchain: BlockchainType, address: string, balance: string): void {
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