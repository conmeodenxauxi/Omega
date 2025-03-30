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
  // Danh sách 20 API key Helius (mỗi key có thể xử lý 10 request/giây)
  'f4b8bccc-ad42-4379-83aa-12037a668596',
  '4634a127-8c86-4f9f-b293-f089744ca86e',
  '6d5a7770-ef7a-4f6f-b24a-3b64a0ac6e24',
  'a3e52c63-33f2-485e-a3e0-932fb1f085cd',
  '12e936a0-b725-4266-8900-10b0a79f0dd4',
  'f4cd2a56-6331-4932-9132-d952b5580eac',
  '32025dc0-9eaa-40bc-b8c3-c9a8cf61aa27',
  '0afb8bd5-9ae6-4fc3-ad24-6a5665eb3431',
  '12282f04-2a6c-4c28-8c97-7015f6738d4a',
  'fec6c5c0-e0e1-4e2b-9e6e-1045b43b57c3',
  '105edf5f-5c01-414d-beb9-031f47031430',
  'c5ebef03-3ad4-4db9-ae81-6e495e6b16fd',
  '5a87ad8b-ed4b-4dac-ab1d-be7aed7fd46a',
  'dc8d3765-7ba1-420f-bc4e-a3bbfd612491',
  '85121755-53e0-42b2-b70e-efeee8bf9576',
  'b3c82ea9-5a04-4688-9efc-e960b24b3e07',
  'd4077d9b-8183-4708-90e7-6d64449dd09e',
  '88a214e2-b5b9-45eb-803d-2f3c6ab5aa50',
  '3bcac472-0eb9-4404-8d20-bb25ca9dadc8',
  'c9fe92c4-6d56-4f0c-8c3f-99ccf9685d7c'
];

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
      const balance = parseSolanaApiResponse(apiConfig.name, data);
      
      console.log(`Solana balance from ${apiConfig.name}: ${balance}`);
      return balance;
    } catch (error) {
      console.error(`Error fetching from ${apiConfig.name}:`, error);
      clearTimeout(timeout);
      return '0';
    }
  } catch (error) {
    console.error(`Error checking Solana balance:`, error);
    return '0';
  }
}