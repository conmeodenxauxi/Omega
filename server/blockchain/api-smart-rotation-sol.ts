/**
 * Cơ chế xoay vòng thông minh dành riêng cho Solana với hệ thống quản lý rate limit
 * Xoay vòng qua tất cả các endpoint và API key có sẵn, tránh các key đang bị rate limit
 */
import { getApiKey } from "./api-keys";
import fetch from "node-fetch";
import { apiRateLimiter } from "./api-rate-limiter";

// Lưu trữ vị trí hiện tại trong bánh xe xoay vòng
let currentSOLSlot = 0;

// Thông tin các API key Helius
const heliusApiKeys: string[] = [
  // Danh sách API key Helius (mỗi key có thể xử lý 10 request/giây)
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
  'c9fe92c4-6d56-4f0c-8c3f-99ccf9685d7c',
  'f769413c-ebdf-4df9-841a-aa054fbce6b2',
  'a5f7d1bc-23f3-4833-80e6-279774f98ef1' // Key mới thêm vào (30/03/2025)
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

// Số lần thử lại tối đa khi không tìm thấy key khả dụng
const MAX_RETRY_FINDING_KEY = 3;

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
 * Lấy cấu hình API tiếp theo cho Solana theo vòng xoay với cơ chế rate limit
 * Đảm bảo mỗi request chỉ gọi 1 API duy nhất và tránh các key đang bị rate limit
 */
function getNextSolanaApi(address: string): {
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  apiKey?: string;
} {
  const totalSlots = calculateTotalSolSlots();
  
  // Nếu không có slot nào, trả về thông báo lỗi
  if (totalSlots === 0) {
    throw new Error('Không có API endpoint hoặc API key nào khả dụng cho Solana');
  }
  
  // Tính slot tiếp theo theo cơ chế xoay vòng truyền thống
  const initialSlot = (currentSOLSlot + 1) % totalSlots;
  
  // PHẦN 1: XỬ LÝ PUBLIC ENDPOINT
  // Nếu slot là public endpoint
  if (initialSlot < publicEndpoints.length) {
    const endpoint = publicEndpoints[initialSlot];
    const endpointId = `SOL_${endpoint.name}`;
    
    // Kiểm tra xem endpoint này có bị rate limit không
    if (apiRateLimiter.canUseKey(endpointId, 'public')) {
      // Cập nhật slot hiện tại
      currentSOLSlot = initialSlot;
      
      // Đánh dấu đã sử dụng endpoint
      apiRateLimiter.useKey(endpointId, 'public');
      
      console.log(`SOL rotation slot: ${currentSOLSlot + 1}/${totalSlots}`);
      console.log(`[SOL Rotation] Đã chọn ${endpoint.name} (public endpoint) - Slot ${currentSOLSlot + 1}/${totalSlots}`);
      
      return {
        name: endpoint.name,
        url: endpoint.url,
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body: endpoint.formatBody(address)
      };
    }
    // Nếu public endpoint đang bị rate limit, tiếp tục tìm key Helius
  }
  
  // PHẦN 2: XỬ LÝ HELIUS API KEY
  // Tìm key khả dụng từ danh sách key Helius
  let retryCount = 0;
  let availableKeyResult = null;
  
  // Tính toán vị trí bắt đầu tìm kiếm trong mảng Helius key
  // Nếu initialSlot nằm trong phạm vi public endpoint, bắt đầu từ key đầu tiên
  // Ngược lại, bắt đầu từ vị trí tương ứng
  const startKeyIndex = initialSlot < publicEndpoints.length 
    ? 0 
    : initialSlot - publicEndpoints.length;
  
  while (retryCount < MAX_RETRY_FINDING_KEY && !availableKeyResult) {
    availableKeyResult = apiRateLimiter.findAvailableKey(
      'SOL_Helius',
      heliusApiKeys,
      startKeyIndex + retryCount
    );
    
    retryCount++;
  }
  
  // Nếu tìm thấy key khả dụng
  if (availableKeyResult) {
    // Cập nhật currentSlot (index + số lượng public endpoint)
    currentSOLSlot = publicEndpoints.length + availableKeyResult.index;
    const apiKey = availableKeyResult.key;
    
    console.log(`SOL rotation slot: ${currentSOLSlot + 1}/${totalSlots}`);
    console.log(`[SOL Rotation] Đã chọn Helius API với API key ${apiKey.substring(0, 6)}... - Slot ${currentSOLSlot + 1}/${totalSlots}`);
    
    return {
      name: 'Helius',
      url: `https://api.helius.xyz/v0/addresses/${address}/balances?api-key=${apiKey}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      apiKey
    };
  }
  
  // PHẦN 3: XỬ LÝ TRƯỜNG HỢP KHÔNG TÌM THẤY KEY KHẢ DỤNG
  // Nếu không tìm thấy key nào khả dụng, quay lại sử dụng cơ chế xoay vòng truyền thống
  currentSOLSlot = initialSlot;
  
  // Nếu là public endpoint
  if (currentSOLSlot < publicEndpoints.length) {
    const endpoint = publicEndpoints[currentSOLSlot];
    console.log(`SOL rotation slot: ${currentSOLSlot + 1}/${totalSlots} (forced - all APIs rate limited)`);
    console.log(`[SOL Rotation] Bắt buộc sử dụng ${endpoint.name} (public endpoint) vì tất cả key đều đang bị rate limit`);
    
    return {
      name: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' },
      body: endpoint.formatBody(address)
    };
  }
  
  // Nếu là Helius API
  const keyIndex = currentSOLSlot - publicEndpoints.length;
  const apiKey = heliusApiKeys[keyIndex];
  
  console.log(`SOL rotation slot: ${currentSOLSlot + 1}/${totalSlots} (forced - all APIs rate limited)`);
  console.log(`[SOL Rotation] Bắt buộc sử dụng Helius API với API key ${apiKey.substring(0, 6)}... vì tất cả key đều đang bị rate limit`);
  
  return {
    name: 'Helius',
    url: `https://api.helius.xyz/v0/addresses/${address}/balances?api-key=${apiKey}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    apiKey
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
 * Kiểm tra số dư Solana bằng cơ chế xoay vòng thông minh với quản lý rate limit
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
      
      // Xử lý các trường hợp rate limit
      if (response.status === 429) {
        console.warn(`Rate limit hit (429) for ${apiConfig.name} - Marking as rate limited`);
        
        // Đánh dấu key này là đang bị rate limit
        if (apiConfig.name === 'Helius' && apiConfig.apiKey) {
          apiRateLimiter.markKeyAsRateLimited('SOL_Helius', apiConfig.apiKey, 60000); // 1 phút timeout
        } else {
          // Nếu là public endpoint
          apiRateLimiter.markKeyAsRateLimited(`SOL_${apiConfig.name}`, 'public', 120000); // 2 phút timeout 
        }
        
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Xử lý phản hồi
      const balance = parseSolanaApiResponse(apiConfig.name, data);
      
      console.log(`Solana balance from ${apiConfig.name}: ${balance}`);
      return balance;
    } catch (error: any) {
      console.error(`Error fetching from ${apiConfig.name}:`, error);
      clearTimeout(timeout);
      
      // Nếu lỗi là từ API và có thông tin về rate limit
      const errorMessage = error.message || '';
      if (
        errorMessage.includes('429') || 
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests')
      ) {
        // Đánh dấu key này là đang bị rate limit  
        if (apiConfig.name === 'Helius' && apiConfig.apiKey) {
          apiRateLimiter.markKeyAsRateLimited('SOL_Helius', apiConfig.apiKey, 60000); // 1 phút timeout
        } else {
          // Nếu là public endpoint
          apiRateLimiter.markKeyAsRateLimited(`SOL_${apiConfig.name}`, 'public', 120000); // 2 phút timeout
        }
      }
      
      return '0';
    }
  } catch (error) {
    console.error(`Error checking Solana balance:`, error);
    return '0';
  }
}