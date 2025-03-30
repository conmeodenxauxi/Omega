/**
 * Cơ chế xoay vòng thông minh dành riêng cho Solana
 * Xoay vòng qua tất cả các endpoint và API key có sẵn, mỗi lần chỉ gọi 1 request
 */
import { getApiKey } from "./api-keys";
import fetch from "node-fetch";

// Lưu trữ vị trí hiện tại trong bánh xe xoay vòng
let currentSOLSlot = 0;

// Thông tin các API key Helius
const heliusApiKeys: string[] = [
  // API keys lấy từ hệ thống xoay vòng
  getApiKey('SOL', 'Helius_1'),
  getApiKey('SOL', 'Helius_2'),
  getApiKey('SOL', 'Helius_3'),
  // Đảm bảo loại bỏ các key trống
].filter(key => key && key.length > 0);

// Thông tin API public (không cần key)
const publicEndpoints = [
  {
    name: 'Solana-RPC-MainNet',
    url: 'https://api.mainnet-beta.solana.com',
    method: 'POST',
    formatBody: (address: string) => JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [address]
    })
  },
  {
    name: 'Solana-Ankr',
    url: 'https://rpc.ankr.com/solana',
    method: 'POST',
    formatBody: (address: string) => JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [address]
    })
  }
];

/**
 * Tính toán tổng số slot cho vòng xoay SOL
 * RPC public không cần key được tính là 1 slot
 * Mỗi API key riêng cũng được tính là 1 slot
 */
function calculateTotalSolSlots(): number {
  // Public endpoints + Helius API keys
  return publicEndpoints.length + heliusApiKeys.length;
}

/**
 * Lấy cấu hình API tiếp theo cho Solana theo vòng xoay
 * Đảm bảo mỗi request chỉ gọi 1 API duy nhất
 */
function getNextSolanaApi(address: string): {
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
} {
  const totalSlots = calculateTotalSolSlots();
  
  // Nếu không có slot nào, trả về thông báo lỗi
  if (totalSlots === 0) {
    throw new Error('Không có API endpoint hoặc API key nào khả dụng cho Solana');
  }
  
  // Xoay vòng qua các slot
  const currentSlot = currentSOLSlot % totalSlots;
  currentSOLSlot = (currentSOLSlot + 1) % totalSlots;
  
  console.log(`SOL rotation slot: ${currentSlot + 1}/${totalSlots}`);
  
  // Trường hợp slot là public endpoint
  if (currentSlot < publicEndpoints.length) {
    const endpoint = publicEndpoints[currentSlot];
    console.log(`[SOL Rotation] Đã chọn ${endpoint.name} (public endpoint) - Slot ${currentSlot + 1}/${totalSlots}`);
    
    return {
      name: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' },
      body: endpoint.formatBody(address)
    };
  }
  
  // Trường hợp slot là Helius API key
  const keyIndex = currentSlot - publicEndpoints.length;
  const apiKey = heliusApiKeys[keyIndex];
  
  console.log(`[SOL Rotation] Đã chọn Helius API với API key ${apiKey.substring(0, 6)}... - Slot ${currentSlot + 1}/${totalSlots}`);
  
  return {
    name: 'Helius',
    url: `https://api.helius.xyz/v0/addresses/${address}/balances?api-key=${apiKey}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };
}

/**
 * Xử lý phản hồi từ API Solana, trả về số dư với định dạng thống nhất
 */
function parseSolanaApiResponse(name: string, data: any): string {
  if (name === 'Helius') {
    // Xử lý phản hồi từ Helius
    if (data && data.nativeBalance !== undefined) {
      // Chuyển đổi từ lamports sang SOL (1 SOL = 10^9 lamports)
      return (data.nativeBalance / 1e9).toFixed(9);
    }
    return '0';
  } else {
    // Xử lý phản hồi từ JSON-RPC (Solana-RPC)
    if (data && data.result && data.result.value !== undefined) {
      // Chuyển đổi từ lamports sang SOL (1 SOL = 10^9 lamports)
      return (data.result.value / 1e9).toFixed(9);
    }
    return '0';
  }
}

/**
 * Kiểm tra số dư Solana bằng cơ chế xoay vòng tuần tự (chỉ 1 request mỗi lần)
 */
export async function checkSolanaBalance(address: string): Promise<string> {
  try {
    // Lấy API endpoint tiếp theo từ vòng xoay
    const apiConfig = getNextSolanaApi(address);
    
    console.log(`Checking SOL balance for ${address} using ${apiConfig.name}`);
    
    // Cấu hình fetch request
    const fetchOptions: any = {
      method: apiConfig.method,
      headers: apiConfig.headers
    };
    
    if (apiConfig.body) {
      fetchOptions.body = apiConfig.body;
    }
    
    // Thực hiện request
    const response = await fetch(apiConfig.url, fetchOptions);
    const data = await response.json();
    
    // Xử lý phản hồi
    const balance = parseSolanaApiResponse(apiConfig.name, data);
    
    console.log(`Solana balance from ${apiConfig.name}: ${balance}`);
    return balance;
  } catch (error) {
    console.error(`Error fetching from ${error instanceof Error ? error.message : 'unknown'}`);
    return '0';
  }
}