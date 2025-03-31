/**
 * Cơ chế phân bổ ngẫu nhiên dành riêng cho Ethereum
 * Chọn ngẫu nhiên một endpoint hoặc API key từ tất cả các endpoint và API key có sẵn,
 * mỗi lần chỉ gọi 1 request để tránh race condition và đảm bảo sử dụng đồng đều các API
 */
import { getApiKey } from "./api-keys";
import fetch from "node-fetch";
import { checkWithBackoff } from "./api-smart-rotation-utils";

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
 * Tính toán tổng số slot cho phân bổ ngẫu nhiên ETH
 * Mỗi RPC public không cần key được tính là 1 slot
 * Mỗi API key riêng cũng được tính là 1 slot
 */
function calculateTotalEthSlots(): number {
  // Public endpoints + Etherscan API keys
  return publicEndpoints.length + etherscanApiKeys.length;
}

/**
 * Lấy cấu hình API cho Ethereum sử dụng phân bổ ngẫu nhiên
 * Đảm bảo mỗi request chỉ gọi 1 API duy nhất và phân tán đều các request
 */
function getRandomEthereumApi(address: string): {
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
} {
  const totalSlots = calculateTotalEthSlots();
  
  // Nếu không có slot nào, trả về thông báo lỗi
  if (totalSlots === 0) {
    throw new Error('Không có API endpoint hoặc API key nào khả dụng cho Ethereum');
  }
  
  // Chọn ngẫu nhiên một slot
  const randomSlot = Math.floor(Math.random() * totalSlots);
  
  console.log(`ETH random slot: ${randomSlot + 1}/${totalSlots}`);
  
  // Trường hợp slot là public endpoint
  if (randomSlot < publicEndpoints.length) {
    const endpoint = publicEndpoints[randomSlot];
    console.log(`[ETH Random] Đã chọn ${endpoint.name} (public endpoint) - Slot ${randomSlot + 1}/${totalSlots}`);
    
    return {
      name: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' },
      body: endpoint.formatBody(address)
    };
  }
  
  // Trường hợp slot là Etherscan API key
  const keyIndex = randomSlot - publicEndpoints.length;
  const apiKey = etherscanApiKeys[keyIndex];
  
  console.log(`[ETH Random] Đã chọn Etherscan với API key ${apiKey.substring(0, 6)}... - Slot ${randomSlot + 1}/${totalSlots}`);
  
  return {
    name: 'Etherscan',
    url: `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
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
 * Kiểm tra số dư Ethereum bằng cơ chế phân bổ ngẫu nhiên (chỉ 1 request mỗi lần)
 */
export async function checkEthereumBalance(address: string): Promise<string> {
  try {
    // Lấy API endpoint ngẫu nhiên
    const apiConfig = getRandomEthereumApi(address);
    
    console.log(`Checking ETH balance for ${address} using ${apiConfig.name}`);
    
    // Cấu hình fetch request
    const fetchOptions: any = {
      method: apiConfig.method,
      headers: apiConfig.headers
    };
    
    if (apiConfig.body) {
      fetchOptions.body = apiConfig.body;
    }
    
    // Thêm retry và backoff strategy
    return await checkWithBackoff(async () => {
      // Thêm timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15 giây timeout
      fetchOptions.signal = controller.signal as any;
      
      try {
        // Thực hiện request
        const response = await fetch(apiConfig.url, fetchOptions);
        clearTimeout(timeout);
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Xử lý phản hồi
        const balance = parseEthereumApiResponse(apiConfig.name, data);
        
        console.log(`Ethereum balance from ${apiConfig.name}: ${balance}`);
        return balance;
      } catch (error) {
        console.error(`Error fetching from ${apiConfig.name}:`, error);
        clearTimeout(timeout);
        throw error; // Ném lỗi để retry strategy xử lý
      }
    }, apiConfig.name); // Sử dụng giá trị mặc định cho số lần retry và delay
  } catch (error) {
    console.error(`All retries failed for ${error instanceof Error ? error.message : 'unknown error'}`);
    return '0';
  }
}