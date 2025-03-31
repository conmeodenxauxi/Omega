/**
 * Cơ chế xoay vòng thông minh dành riêng cho Bitcoin
 * Xoay vòng NGẪU NHIÊN qua tất cả các endpoint và API key có sẵn, mỗi lần chỉ gọi 1 request
 * Cơ chế ngẫu nhiên giúp tránh rate limit khi nhiều phiên cùng hoạt động
 * Tích hợp cơ chế tự động tạm dừng API key bị rate limit trong 1 phút
 */
import { getApiKey } from "./api-keys";
import fetch from "node-fetch";
import { 
  isKeyRateLimited, 
  markKeyAsRateLimited, 
  isEndpointRateLimited, 
  markEndpointAsRateLimited 
} from "./api-rate-limit-manager";
import { checkWithBackoff } from "./api-smart-rotation-utils";

// Thông tin API keys Tatum cho Bitcoin
const tatumBTCApiKeys: string[] = [
  // API keys cho Tatum
  't-646d7ac5a0ce9d0014c9e5e2-e9c6cd79c5784e8783b44d5016dc3f77',
  't-646d7ac5a0ce9d0014c9e5e3-d969f98c8dff4d57a63afca42aeb2942',
  't-646d7ac5a0ce9d0014c9e5e4-5c0f6f5fa8e348669a0efa731de6ffd8',
  't-646d7ac5a0ce9d0014c9e5e5-5ee09c0bc19e4d3cbaeda55bb1b8b292',
  't-646d7ac5a0ce9d0014c9e5e6-bb8c12b7cb0d4e5598e6037ea363e5a5',
  't-646d7ac5a0ce9d0014c9e5e7-cfa06f84e6db47eabd03d935c9c925a2',
  't-646d7ac5a0ce9d0014c9e5e8-4e5d41c0a2084fe2abea2bc413f4d03e',
  't-646d7ac5a0ce9d0014c9e5e9-3992e46fb864494b84da4abcfba0f6a3',
  't-646d7ac5a0ce9d0014c9e5ea-6b38eaa8da394fcbbc6e6a3bd82e1e27',
  't-646d7ac5a0ce9d0014c9e5eb-ee7be8fef8c9475f956c46ddd3d71a9d',
  't-646d7ac5a0ce9d0014c9e5ec-dc3b5646b7e0485783f68489fb662296',
  't-646d7ac5a0ce9d0014c9e5ed-9d52db20c03e4d2f97fd1c5f8781a2ba',
  't-67e88a12a09b180014a6c9c1-c70eea7b22634c4a8c0dc7f90e61c80a',
  't-67e88a12a09b180014a6c9c2-b989ce8b4ea14b8e9d74bf8e4de1e5ef',
  't-67e88a12a09b180014a6c9c3a-dde2b38ee6ef4f61817aa03fee93fa47',
  't-67e88a12a09b180014a6c9c3b-a32ed1b5e5d54f9fba79f2f6d1d73c2a',
];

// API keys của GetBlock cho Bitcoin
const getBlockBTCApiKeys: string[] = [
  // API keys cho GetBlock
  '053fa1bf-0cef-4f77-8513-7b8ce95e95e7',
  '0c7f9c19-64c2-49bc-9aec-40a47fc3c6a0',
  '6ac4cccd-6f6a-4e0e-bfca-0f368d5df8f1',
];

// Thông tin API public (không cần key)
const publicEndpoints = [
  {
    name: 'Blockchair',
    url: 'https://api.blockchair.com/bitcoin/dashboards/address/{{address}}?limit=1',
    method: 'GET',
    formatUrl: (address: string) => `https://api.blockchair.com/bitcoin/dashboards/address/${address}?limit=1`,
  },
  {
    name: 'BlockCypher',
    url: 'https://api.blockcypher.com/v1/btc/main/addrs/{{address}}/balance',
    method: 'GET',
    formatUrl: (address: string) => `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`,
  },
  {
    name: 'Blockchain.com',
    url: 'https://blockchain.info/balance?active={{address}}',
    method: 'GET',
    formatUrl: (address: string) => `https://blockchain.info/balance?active=${address}`,
  },
];

/**
 * Định nghĩa kiểu API config với hỗ trợ keyIdentifier
 */
interface BitcoinApiConfig {
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  keyIdentifier?: string; // Định danh của API key để xác định khi bị ratelimit
}

/**
 * Tính toán tổng số slot cho vòng xoay BTC
 */
function calculateTotalBitcoinSlots(): number {
  return publicEndpoints.length + tatumBTCApiKeys.length + getBlockBTCApiKeys.length;
}

/**
 * Lấy cấu hình API tiếp theo cho Bitcoin theo cơ chế ngẫu nhiên
 * Đảm bảo mỗi request chỉ gọi 1 API duy nhất
 * Áp dụng cơ chế hoàn toàn ngẫu nhiên để tránh rate limit khi nhiều phiên cùng hoạt động
 * Bỏ qua các API key đang bị giới hạn tốc độ
 */
function getNextBitcoinApi(address: string): BitcoinApiConfig {
  const totalSlots = calculateTotalBitcoinSlots();
  
  // Danh sách chứa các slots khả dụng (không bị rate limit)
  const availableSlots: number[] = [];
  
  // Kiểm tra public endpoints
  for (let i = 0; i < publicEndpoints.length; i++) {
    if (!isEndpointRateLimited('BTC', publicEndpoints[i].name)) {
      availableSlots.push(i);
    }
  }
  
  // Kiểm tra Tatum API keys
  for (let i = 0; i < tatumBTCApiKeys.length; i++) {
    const keyIdentifier = tatumBTCApiKeys[i].substring(0, 8);
    if (!isKeyRateLimited('BTC', 'BTC_Tatum', keyIdentifier)) {
      availableSlots.push(i + publicEndpoints.length);
    }
  }
  
  // Kiểm tra GetBlock API keys
  for (let i = 0; i < getBlockBTCApiKeys.length; i++) {
    const keyIdentifier = getBlockBTCApiKeys[i].substring(0, 8);
    if (!isKeyRateLimited('BTC', 'GetBlock', keyIdentifier)) {
      availableSlots.push(i + publicEndpoints.length + tatumBTCApiKeys.length);
    }
  }
  
  // Nếu không có slot nào khả dụng, trả về thông báo lỗi hoặc chọn ngẫu nhiên
  if (availableSlots.length === 0) {
    console.warn('Tất cả slots đều đang bị rate limited. Thử lại với slot ngẫu nhiên.');
    // Chọn ngẫu nhiên một slot bất kỳ khi tất cả đều bị rate limit
    const randomSlot = Math.floor(Math.random() * totalSlots);
    availableSlots.push(randomSlot);
  }
  
  // Chọn ngẫu nhiên một slot từ các slot khả dụng
  const randomIndex = Math.floor(Math.random() * availableSlots.length);
  const selectedSlot = availableSlots[randomIndex];
  
  console.log(`BTC random slot: ${selectedSlot + 1}/${totalSlots}`);
  
  // Trường hợp slot là public endpoint
  if (selectedSlot < publicEndpoints.length) {
    const endpoint = publicEndpoints[selectedSlot];
    console.log(`[BTC Random] Đã chọn ${endpoint.name} (không cần key) - Slot ${selectedSlot + 1}/${totalSlots}`);
    
    return {
      name: endpoint.name,
      url: endpoint.formatUrl(address),
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' }
    };
  }
  
  // Trường hợp slot là Tatum API key
  if (selectedSlot < publicEndpoints.length + tatumBTCApiKeys.length) {
    const keyIndex = selectedSlot - publicEndpoints.length;
    const apiKey = tatumBTCApiKeys[keyIndex];
    
    console.log(`[BTC Random] Đã chọn BTC_Tatum với API key ${apiKey.substring(0, 8)}... - Slot ${selectedSlot + 1}/${totalSlots}`);
    
    return {
      name: 'BTC_Tatum',
      url: `https://api.tatum.io/v3/bitcoin/address/balance/${address}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      keyIdentifier: apiKey.substring(0, 8)
    };
  }
  
  // Trường hợp slot là GetBlock API key
  const gbKeyIndex = selectedSlot - publicEndpoints.length - tatumBTCApiKeys.length;
  const gbApiKey = getBlockBTCApiKeys[gbKeyIndex];
  
  console.log(`[BTC Random] Đã chọn GetBlock với API key ${gbApiKey.substring(0, 8)}... - Slot ${selectedSlot + 1}/${totalSlots}`);
  
  return {
    name: 'GetBlock',
    url: 'https://go.getblock.io/mainnet/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': gbApiKey
    },
    keyIdentifier: gbApiKey.substring(0, 8)
  };
}

/**
 * Xử lý phản hồi từ API Bitcoin, trả về số dư với định dạng thống nhất
 */
function parseBitcoinApiResponse(name: string, data: any, address: string): string {
  if (name === 'BlockCypher') {
    // Xử lý phản hồi từ BlockCypher
    if (data.balance !== undefined) {
      return (data.balance / 100000000).toFixed(8);
    }
    return '0';
  } else if (name === 'Blockchair') {
    // Xử lý phản hồi từ Blockchair
    if (data?.data && data.data[address]?.address?.balance) {
      return (data.data[address].address.balance / 100000000).toFixed(8);
    }
    return '0';
  } else if (name === 'Blockchain.com') {
    // Xử lý phản hồi từ Blockchain.info
    if (data && data[address] && data[address].final_balance !== undefined) {
      return (data[address].final_balance / 100000000).toFixed(8);
    }
    return '0';
  } else if (name === 'BTC_Tatum') {
    // Xử lý phản hồi từ Tatum
    if (data?.incoming && data?.outgoing) {
      const balance = parseFloat(data.incoming) - parseFloat(data.outgoing);
      return balance.toFixed(8);
    }
    return '0';
  } else if (name === 'GetBlock') {
    // Xử lý phản hồi từ GetBlock
    if (data?.result?.balance !== undefined) {
      return (data.result.balance / 100000000).toFixed(8);
    }
    return '0';
  }
  
  return '0';
}

/**
 * Kiểm tra số dư Bitcoin bằng cơ chế xoay vòng ngẫu nhiên (chỉ 1 request mỗi lần)
 * Cơ chế ngẫu nhiên giúp phân tán tải khi nhiều phiên cùng hoạt động
 * Tích hợp cơ chế tự động tạm dừng API key bị rate limit trong 1 phút
 */
export async function checkBitcoinBalance(address: string): Promise<string> {
  try {
    // Lấy API endpoint ngẫu nhiên
    const apiConfig = getNextBitcoinApi(address);
    
    console.log(`Checking BTC balance for ${address} using ${apiConfig.name}`);
    
    // Xử lý đặc biệt cho GetBlock (JSON-RPC)
    if (apiConfig.name === 'GetBlock') {
      // Tạo request body cho JSON-RPC
      const requestBody = {
        jsonrpc: '2.0',
        method: 'getaddressbalance',
        params: [{ addresses: [address] }],
        id: 'getbalance'
      };
      
      return await checkWithBackoff(async () => {
        try {
          const controller = new AbortController();
          // Giới hạn thời gian chờ là 10 giây để tránh treo khi API bị quá tải
          const timeout = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(apiConfig.url, {
            method: apiConfig.method,
            headers: apiConfig.headers,
            body: JSON.stringify(requestBody),
            signal: controller.signal as any
          });
          
          clearTimeout(timeout);
          
          if (!response.ok) {
            // Kiểm tra lỗi xác thực (401) cho GetBlock
            if (response.status === 401) {
              console.warn(`Lỗi xác thực (Unauthorized) với ${apiConfig.name}. API key có thể đã hết hạn hoặc không hợp lệ.`);
              // Đánh dấu API key là bị giới hạn để tạm thời loại bỏ khỏi vòng xoay
              if (apiConfig.keyIdentifier) {
                markKeyAsRateLimited('BTC', apiConfig.name, apiConfig.keyIdentifier);
              }
              throw new Error(`HTTP error: 401 Unauthorized`);
            }
            
            // Kiểm tra lỗi rate limit
            const isRateLimit = 
              response.status === 429 || 
              response.status === 403 || 
              response.status === 402 || 
              response.statusText?.toLowerCase().includes('rate') ||
              response.statusText?.toLowerCase().includes('limit');
            
            if (isRateLimit && apiConfig.keyIdentifier) {
              console.warn(`RATE LIMIT phát hiện cho ${apiConfig.name}`);
              markKeyAsRateLimited('BTC', apiConfig.name, apiConfig.keyIdentifier);
            }
            
            throw new Error(`HTTP error: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Xử lý phản hồi
          const balance = parseBitcoinApiResponse(apiConfig.name, data, address);
          console.log(`Bitcoin balance from ${apiConfig.name}: ${balance}`);
          return balance;
        } catch (error) {
          console.error(`Error fetching from ${apiConfig.name}:`, error);
          
          // Kiểm tra lỗi timeout hoặc network
          const errorMessage = String(error).toLowerCase();
          if (
            (error instanceof Error && error.name === 'AbortError') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('networkerror')
          ) {
            if (apiConfig.keyIdentifier) {
              console.warn(`Timeout hoặc lỗi mạng với ${apiConfig.name}, có thể do API quá tải`);
              markKeyAsRateLimited('BTC', apiConfig.name, apiConfig.keyIdentifier);
            }
          }
          
          // Xử lý lỗi DNS (ENOTFOUND)
          if (errorMessage.includes('enotfound')) {
            console.warn(`Lỗi DNS (ENOTFOUND) với ${apiConfig.name}. URL có thể không chính xác hoặc dịch vụ không khả dụng.`);
            // Đánh dấu endpoint là bị hạn chế tạm thời
            if (apiConfig.keyIdentifier) {
              markKeyAsRateLimited('BTC', apiConfig.name, apiConfig.keyIdentifier);
            }
          }
          
          throw error;
        }
      }, 3, apiConfig.name);
    }

    // Xử lý các API chuẩn REST (không phải JSON-RPC)
    return await checkWithBackoff(async () => {
      try {
        const controller = new AbortController();
        // Giới hạn thời gian chờ là 10 giây để tránh treo khi API bị quá tải
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(apiConfig.url, {
          method: apiConfig.method,
          headers: apiConfig.headers,
          signal: controller.signal as any
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          if (response.status === 401 && apiConfig.name === 'BTC_Tatum') {
            // Xử lý lỗi xác thực riêng cho Tatum API
            console.warn(`Lỗi xác thực (Unauthorized) với ${apiConfig.name}. API key có thể đã hết hạn hoặc không hợp lệ.`);
            // Vẫn đánh dấu API key là bị giới hạn để tạm thời loại bỏ khỏi hệ thống
            if (apiConfig.keyIdentifier) {
              markKeyAsRateLimited('BTC', apiConfig.name, apiConfig.keyIdentifier);
            }
            throw { status: response.status, message: 'Unauthorized' };
          }
          
          // Kiểm tra lỗi rate limit
          const isRateLimit = 
            response.status === 429 || 
            response.status === 403 || 
            response.status === 402 || 
            response.statusText?.toLowerCase().includes('rate') ||
            response.statusText?.toLowerCase().includes('limit');
          
          if (isRateLimit) {
            console.warn(`RATE LIMIT phát hiện cho ${apiConfig.name}`);
            
            if (apiConfig.keyIdentifier) {
              // Đánh dấu API key bị rate limit
              markKeyAsRateLimited('BTC', apiConfig.name, apiConfig.keyIdentifier);
            } else {
              // Đánh dấu endpoint public bị rate limit
              markEndpointAsRateLimited('BTC', apiConfig.name);
            }
          }
          
          throw { status: response.status, message: response.statusText };
        }
        
        const data = await response.json();
        
        // Kiểm tra lỗi rate limit trong phản hồi
        const responseText = JSON.stringify(data).toLowerCase();
        if (
          responseText.includes("rate limit") || 
          responseText.includes("ratelimit") ||
          responseText.includes("too many requests") ||
          responseText.includes("quota exceeded")
        ) {
          console.warn(`RATE LIMIT phát hiện trong phản hồi từ ${apiConfig.name}`);
          
          if (apiConfig.keyIdentifier) {
            // Đánh dấu API key bị rate limit
            markKeyAsRateLimited('BTC', apiConfig.name, apiConfig.keyIdentifier);
          } else {
            // Đánh dấu endpoint public bị rate limit
            markEndpointAsRateLimited('BTC', apiConfig.name);
          }
          
          throw { status: 429, message: 'Rate limited' };
        }
        
        // Xử lý phản hồi
        const balance = parseBitcoinApiResponse(apiConfig.name, data, address);
        console.log(`Bitcoin balance from ${apiConfig.name}: ${balance}`);
        return balance;
      } catch (error) {
        console.error(`Error fetching from ${apiConfig.name}:`, error);
        
        // Kiểm tra lỗi timeout hoặc network
        const errorMessage = String(error).toLowerCase();
        if (
          (error instanceof Error && error.name === 'AbortError') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('networkerror')
        ) {
          if (apiConfig.keyIdentifier) {
            console.warn(`Timeout hoặc lỗi mạng với ${apiConfig.name}, có thể do API quá tải`);
            markKeyAsRateLimited('BTC', apiConfig.name, apiConfig.keyIdentifier);
          } else if (apiConfig.name) {
            markEndpointAsRateLimited('BTC', apiConfig.name);
          }
        }
        
        throw error;
      }
    }, 3, apiConfig.name);
  } catch (error) {
    console.error(`All retries failed for ${error instanceof Error ? error.message : error}`);
    return '0';
  }
}