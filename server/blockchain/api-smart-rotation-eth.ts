/**
 * Cơ chế xoay vòng thông minh dành riêng cho Ethereum
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
import { checkWithBackoff, timeoutPromise } from "./api-smart-rotation-utils";

// Không còn sử dụng vị trí tuần tự do đã chuyển sang cơ chế ngẫu nhiên
// let currentETHSlot = 0;

// Thông tin các API key Etherscan
const etherscanApiKeys: string[] = [
  // Danh sách API key Etherscan
  '6HR4FUXUD5FH36DDKTK9TA3B5WKWR44YP7',
  'HPMEDCEEEA7E6J88PG9M537WEQKG4KCCB5',
  'K1M8UDC11K6S1V7VEQ935EJ7FEE4HPM2NU',
  'IXJ5QWRMTS7PN6VWZBPYB5JU2NXF4E2VTN',
  'VRQ3TVXNRCRRATUWSWIESHT4KGU2QR4GH4',
  '2GQ4QNFWYIZZCESJ3D25DBDG7PYHQPGEW2',
  'RNGF5FWH61KIVIESQHKKTA1NFUHRVPQCX6',
  'XE1PPFNEFWF4QMRIF969ITHBXXSFPBRKDR',
  'JIBT19A992QRZIS91MM1WYDPESS3R64ACX',
  'K2GNPYITPPVNFYYX837KWMCJICPNAJMVSG',
  // Đảm bảo loại bỏ các key trống
].filter(key => key && key.length > 0);

// Thông tin API public (không cần key)
const publicEndpoints = [
  {
    name: 'ETH-Public-1',
    url: 'https://eth.llamarpc.com', // LlamaRPC public endpoint
    method: 'POST',
    formatBody: (address: string) => JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest']
    })
  },
  {
    name: 'ETH-Public-2',
    url: 'https://ethereum.publicnode.com',
    method: 'POST',
    formatBody: (address: string) => JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest']
    })
  }
];

/**
 * Định nghĩa kiểu API config với hỗ trợ keyIdentifier
 */
interface EthereumApiConfig {
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  keyIdentifier?: string; // Định danh của API key để xác định khi bị ratelimit
}

/**
 * Tính toán tổng số slot cho vòng xoay ETH
 * RPC public không cần key được tính là 1 slot
 * Mỗi API key riêng cũng được tính là 1 slot
 */
function calculateTotalEthSlots(): number {
  // Public endpoints + Etherscan API keys
  return publicEndpoints.length + etherscanApiKeys.length;
}

/**
 * Lấy cấu hình API tiếp theo cho Ethereum theo cơ chế ngẫu nhiên
 * Đảm bảo mỗi request chỉ gọi 1 API duy nhất
 * Áp dụng cơ chế hoàn toàn ngẫu nhiên để tránh rate limit khi nhiều phiên cùng hoạt động
 * Bỏ qua các API key đang bị giới hạn tốc độ
 */
function getNextEthereumApi(address: string): EthereumApiConfig {
  const totalSlots = calculateTotalEthSlots();
  
  // Danh sách chứa các slots khả dụng (không bị rate limit)
  const availableSlots: number[] = [];
  
  // Kiểm tra public endpoints
  for (let i = 0; i < publicEndpoints.length; i++) {
    if (!isEndpointRateLimited('ETH', publicEndpoints[i].name)) {
      availableSlots.push(i);
    }
  }
  
  // Kiểm tra Etherscan API keys
  for (let i = 0; i < etherscanApiKeys.length; i++) {
    const keyIdentifier = etherscanApiKeys[i].substring(0, 8);
    if (!isKeyRateLimited('ETH', 'Etherscan', keyIdentifier)) {
      availableSlots.push(i + publicEndpoints.length);
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
  
  console.log(`ETH random slot: ${selectedSlot + 1}/${totalSlots} (từ ${availableSlots.length} slots khả dụng)`);
  
  // Trường hợp slot là public endpoint
  if (selectedSlot < publicEndpoints.length) {
    const endpoint = publicEndpoints[selectedSlot];
    console.log(`[ETH Random] Đã chọn ${endpoint.name} (public endpoint) - Slot ${selectedSlot + 1}/${totalSlots}`);
    
    return {
      name: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' },
      body: endpoint.formatBody(address)
    };
  }
  
  // Trường hợp slot là Etherscan API key
  const keyIndex = selectedSlot - publicEndpoints.length;
  const apiKey = etherscanApiKeys[keyIndex];
  
  console.log(`[ETH Random] Đã chọn Etherscan với API key ${apiKey.substring(0, 6)}... - Slot ${selectedSlot + 1}/${totalSlots}`);
  
  return {
    name: 'Etherscan',
    url: `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    keyIdentifier: apiKey.substring(0, 8)
  };
}

/**
 * Xử lý phản hồi từ API Ethereum, trả về số dư với định dạng thống nhất
 */
function parseEthereumApiResponse(name: string, data: any): string {
  if (name === 'Etherscan') {
    // Xử lý phản hồi từ Etherscan
    if (data && data.status === '1' && data.result) {
      const balanceWei = BigInt(data.result);
      return (Number(balanceWei) / 1e18).toFixed(18);
    }
    return '0';
  } else {
    // Xử lý phản hồi từ JSON-RPC (ETH-Public endpoints)
    if (data && data.result) {
      const balanceWei = BigInt(data.result);
      return (Number(balanceWei) / 1e18).toFixed(18);
    }
    return '0';
  }
}

/**
 * Kiểm tra số dư Ethereum bằng cơ chế xoay vòng ngẫu nhiên (chỉ 1 request mỗi lần)
 * Cơ chế ngẫu nhiên giúp phân tán tải khi nhiều phiên cùng hoạt động
 * Tích hợp cơ chế tự động tạm dừng API key bị rate limit trong 1 phút
 */
export async function checkEthereumBalance(address: string): Promise<string> {
  try {
    // Lấy API endpoint ngẫu nhiên
    const apiConfig = getNextEthereumApi(address);
    
    console.log(`Checking ETH balance for ${address} using ${apiConfig.name}`);
    
    return await checkWithBackoff(async () => {
      try {
        // Cấu hình fetch request
        const fetchOptions: any = {
          method: apiConfig.method,
          headers: apiConfig.headers
        };
        
        if (apiConfig.body) {
          fetchOptions.body = apiConfig.body;
        }
        
        // Thêm timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 giây timeout
        fetchOptions.signal = controller.signal as any;
        
        // Thực hiện request
        const response = await fetch(apiConfig.url, fetchOptions);
        clearTimeout(timeout);
        
        if (!response.ok) {
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
              markKeyAsRateLimited('ETH', apiConfig.name, apiConfig.keyIdentifier);
            } else {
              // Đánh dấu endpoint public bị rate limit
              markEndpointAsRateLimited('ETH', apiConfig.name);
            }
          }
          
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Kiểm tra lỗi rate limit trong phản hồi
        const responseText = JSON.stringify(data).toLowerCase();
        if (
          responseText.includes("rate limit") || 
          responseText.includes("ratelimit") ||
          responseText.includes("too many requests") ||
          responseText.includes("quota exceeded") ||
          responseText.includes("max rate limit")
        ) {
          console.warn(`RATE LIMIT phát hiện trong phản hồi từ ${apiConfig.name}`);
          
          if (apiConfig.keyIdentifier) {
            // Đánh dấu API key bị rate limit
            markKeyAsRateLimited('ETH', apiConfig.name, apiConfig.keyIdentifier);
          } else {
            // Đánh dấu endpoint public bị rate limit
            markEndpointAsRateLimited('ETH', apiConfig.name);
          }
          
          throw new Error(`Rate limit trong phản hồi`);
        }
        
        // Xử lý phản hồi
        const balance = parseEthereumApiResponse(apiConfig.name, data);
        console.log(`Ethereum balance from ${apiConfig.name}: ${balance}`);
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
            markKeyAsRateLimited('ETH', apiConfig.name, apiConfig.keyIdentifier);
          } else if (apiConfig.name) {
            markEndpointAsRateLimited('ETH', apiConfig.name);
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