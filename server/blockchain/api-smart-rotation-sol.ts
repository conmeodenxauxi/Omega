/**
 * Cơ chế xoay vòng thông minh dành riêng cho Solana
 * Xoay vòng qua tất cả các endpoint và API key có sẵn, mỗi lần chỉ gọi 1 request
 */
import { getApiKey } from "./api-keys";
import fetch from "node-fetch";

// Lưu trữ vị trí hiện tại trong bánh xe xoay vòng
let currentSOLSlot = 0;

// Danh sách API keys Helius cố định
const heliusApiKeys: string[] = [
  // 20 Helius API keys đã xác nhận hoạt động
  '7f2bdca6-6f7c-4f80-9f51-3de6c53d8bcc',
  '47747d9c-3ec1-4343-af1d-1c40b9d14ff6',
  'df99fe42-24c8-4e31-849e-7363f8c68f97',
  'ae60722e-3a81-4841-bd41-45fcae92a271',
  '3e07f178-d169-4250-91f8-16700f2dd88f',
  '93a77d3d-6115-40aa-9fde-9e932b321318',
  'b5119a65-96f9-44b9-93e4-6f4c3a73a51d',
  '701d1c01-710a-442a-8dc8-626d04c78854',
  'd6389e8e-5730-4c5a-95b1-f73eed140c98',
  'afc70c2a-8d4a-4e2c-a0d4-5ace73897b73',
  'b5f2e8c5-d599-4139-95b5-532e56b8ef80',
  '5d1ed6e4-2f17-4442-9a57-29f9e5d1cc60',
  'aed2fd41-1d11-4c7a-b8ac-40ef50a0e851',
  'f9b03a24-89b1-4549-9bf9-4a3c6ebea576',
  '8c4f6e7a-bb93-4b07-8e67-6c46ddf55e2f',
  'e4a7ad23-a358-48e5-9830-576e6a7d3890',
  '38a6f01b-e32b-492c-9a96-29ad3d45b838',
  'cd2e7fad-15b4-4896-98d5-b9dccb6ca55e',
  '7b3a5e78-6ff3-402c-b390-7160f755d3d2',
  '1a8b6c2d-4f9e-40e3-967a-91d2c8f5b0a7'
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
  // Số lượng API endpoints công khai + Số lượng API keys Helius
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
  
  // Sử dụng JSON-RPC endpoint của Helius để lấy số dư
  return {
    name: 'Helius',
    url: `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [address]
    })
  };
}

/**
 * Xử lý phản hồi từ API Solana, trả về số dư với định dạng thống nhất
 */
function parseSolanaApiResponse(name: string, data: any): string {
  if (name === 'Helius') {
    // Xử lý phản hồi từ Helius JSON-RPC
    if (data && data.result !== undefined) {
      // Chuyển đổi từ lamports sang SOL (1 SOL = 10^9 lamports)
      return (data.result / 1e9).toFixed(9);
    } else if (data && data.error) {
      console.log(`Helius API error: ${JSON.stringify(data.error)}`);
      return '0';
    } else if (data && data.nativeBalance !== undefined) {
      // Cấu trúc cũ: { nativeBalance: number }
      return (data.nativeBalance / 1e9).toFixed(9);
    } else if (data && data.tokens && Array.isArray(data.tokens)) {
      // Tìm token SOL trong mảng tokens
      const solToken = data.tokens.find((token: any) => token.tokenAccount === null);
      if (solToken && solToken.amount !== undefined) {
        return (solToken.amount / 1e9).toFixed(9);
      }
    } else if (data && data.native !== undefined) {
      // Cấu trúc mới: { native: number }
      return (data.native / 1e9).toFixed(9);
    } else if (data && Array.isArray(data) && data.length > 0 && data[0].lamports !== undefined) {
      // Cấu trúc mảng: [{ lamports: number }]
      return (data[0].lamports / 1e9).toFixed(9);
    }
    console.log("Helius response không chứa thông tin số dư đúng định dạng:", JSON.stringify(data).substring(0, 200));
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
    
    // Log dữ liệu phản hồi để debug
    console.log(`Solana response from ${apiConfig.name}:`, JSON.stringify(data).substring(0, 200));
    
    // Xử lý phản hồi
    const balance = parseSolanaApiResponse(apiConfig.name, data);
    
    console.log(`Solana balance from ${apiConfig.name}: ${balance}`);
    return balance;
  } catch (error) {
    console.error(`Error fetching from ${error instanceof Error ? error.message : 'unknown'}`);
    return '0';
  }
}