/**
 * Cơ chế phân bổ ngẫu nhiên dành riêng cho Binance Smart Chain (BSC)
 * Chọn ngẫu nhiên một endpoint hoặc API key từ tất cả các endpoint và API key có sẵn,
 * mỗi lần chỉ gọi 1 request để tránh race condition và đảm bảo sử dụng đồng đều các API
 */
import { getApiKey } from "./api-keys";
import fetch from "node-fetch";
import { checkWithBackoff } from "./api-smart-rotation-utils";

// Thông tin các API key BSCScan
const bscscanApiKeys: string[] = [
  // Danh sách API key BSCScan
  'SC7YSPT8Y3MGPMCQSA4NRZ92UARVVWNQ1F',
  'JM5N75SSNBA2XN88BUGVX6H3TSSZD49QF8',
  'GM4IDJPDAXUYT9P29NUGIDW3HDW66GH98N',
  'KUNAHVNV814NTCQSXS4DW5WX3CAWAAKGDC',
  'C9IDICZE45MKSUE4IKGAKZ2RDIXUJGXB9P',
  'T8FNJ8M7TCQ4AIRPPMS2GWZBBY96YCQRKT',
  'BA3KWB3GSXJW3G33FC75RVE6C1HYY81JR7',
  'KXTPQ38KJ4GEW4TEUVY36RZHPHRUKDVJJD',
  'YSV3J1572I7BPW7I8JG92YB1V4W9YNY4N2',
  'IGWA6ZTGJ7YY6C8FVEW1TRHRK6VMKU4C95',
  // Đảm bảo loại bỏ các key trống
].filter(key => key && key.length > 0);

// Thông tin API public (không cần key)
const publicEndpoints = [
  {
    name: 'BSC-RPC',
    url: 'https://bsc-dataseed1.binance.org',
    method: 'POST',
    formatBody: (address: string) => JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest']
    })
  },
  {
    name: 'BSC-RPC-2',
    url: 'https://bsc-dataseed2.binance.org',
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
 * Tính toán tổng số slot cho phân bổ ngẫu nhiên BSC
 * Mỗi RPC public không cần key được tính là 1 slot
 * Mỗi API key riêng cũng được tính là 1 slot
 */
function calculateTotalBscSlots(): number {
  // Public endpoints + BSCScan API keys
  return publicEndpoints.length + bscscanApiKeys.length;
}

/**
 * Lấy cấu hình API cho BSC sử dụng phân bổ ngẫu nhiên
 * Đảm bảo mỗi request chỉ gọi 1 API duy nhất và phân tán đều các request
 */
function getRandomBscApi(address: string): {
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
} {
  const totalSlots = calculateTotalBscSlots();
  
  // Nếu không có slot nào, trả về thông báo lỗi
  if (totalSlots === 0) {
    throw new Error('Không có API endpoint hoặc API key nào khả dụng cho BSC');
  }
  
  // Chọn ngẫu nhiên một slot
  const randomSlot = Math.floor(Math.random() * totalSlots);
  
  console.log(`BSC random slot: ${randomSlot + 1}/${totalSlots}`);
  
  // Trường hợp slot là public endpoint
  if (randomSlot < publicEndpoints.length) {
    const endpoint = publicEndpoints[randomSlot];
    console.log(`[BSC Random] Đã chọn ${endpoint.name} (public endpoint) - Slot ${randomSlot + 1}/${totalSlots}`);
    
    return {
      name: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' },
      body: endpoint.formatBody(address)
    };
  }
  
  // Trường hợp slot là BSCScan API key
  const keyIndex = randomSlot - publicEndpoints.length;
  const apiKey = bscscanApiKeys[keyIndex];
  
  console.log(`[BSC Random] Đã chọn BSCScan với API key ${apiKey.substring(0, 6)}... - Slot ${randomSlot + 1}/${totalSlots}`);
  
  return {
    name: 'BSCScan',
    url: `https://api.bscscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };
}

/**
 * Xử lý phản hồi từ API BSC, trả về số dư với định dạng thống nhất
 */
function parseBscApiResponse(name: string, data: any): string {
  if (name === 'BSCScan') {
    // Xử lý phản hồi từ BSCScan
    if (data && data.status === '1' && data.result) {
      const balanceWei = BigInt(data.result);
      return (Number(balanceWei) / 1e18).toFixed(18);
    }
    return '0';
  } else {
    // Xử lý phản hồi từ JSON-RPC (BSC-RPC)
    if (data && data.result) {
      const balanceWei = BigInt(data.result);
      return (Number(balanceWei) / 1e18).toFixed(18);
    }
    return '0';
  }
}

/**
 * Kiểm tra số dư BSC bằng cơ chế phân bổ ngẫu nhiên (chỉ 1 request mỗi lần)
 */
export async function checkBscBalance(address: string): Promise<string> {
  try {
    // Lấy API endpoint ngẫu nhiên
    const apiConfig = getRandomBscApi(address);
    
    console.log(`Checking BSC balance for ${address} using ${apiConfig.name}`);
    
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
        const balance = parseBscApiResponse(apiConfig.name, data);
        
        console.log(`BSC balance from ${apiConfig.name}: ${balance}`);
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