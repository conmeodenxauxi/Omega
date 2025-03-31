/**
 * Cơ chế phân bổ ngẫu nhiên thích ứng dành riêng cho Solana
 * Chọn ngẫu nhiên một endpoint hoặc API key từ tất cả các endpoint và API key có sẵn,
 * điều chỉnh trọng số dựa trên hiệu suất để tối ưu hóa việc sử dụng API
 */
import { BlockchainType } from "@shared/schema";
import { getApiKey } from "./api-keys";
import fetch from "node-fetch";
import { checkWithBackoff } from "./api-smart-rotation-utils";
import { registerProvider, reportSuccess, reportError, reportRateLimit, selectWeightedProvider } from './api-adaptive-manager';

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

/**
 * Tính toán tổng số slot cho phân bổ ngẫu nhiên SOL
 * Mỗi RPC public không cần key được tính là 1 slot
 * Mỗi API key Helius riêng cũng được tính là 1 slot
 */
function calculateTotalSolSlots(): number {
  // Public endpoints + Helius API keys
  return publicEndpoints.length + heliusApiKeys.length;
}

/**
 * Lấy cấu hình API cho Solana sử dụng phân bổ ngẫu nhiên thích ứng
 * Tận dụng trọng số thích ứng để ưu tiên các endpoint có độ tin cậy cao
 */
function getNextSolanaApi(address: string): {
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
} {
  // Đầu tiên đăng ký các providers với hệ thống quản lý API thích ứng
  
  // Đăng ký endpoint công khai
  for (const endpoint of publicEndpoints) {
    registerProvider('SOL', endpoint.name);
  }
  
  // Đăng ký các Helius key như các providers riêng biệt
  for (let i = 0; i < heliusApiKeys.length; i++) {
    const providerName = `Helius-${i+1}`;
    registerProvider('SOL', providerName);
  }
  
  // Lưu trữ tất cả tên providers có sẵn cho Solana
  const providers: string[] = [
    ...publicEndpoints.map(endpoint => endpoint.name)
  ];
  
  // Thêm các key Helius như các providers riêng biệt
  for (let i = 0; i < heliusApiKeys.length; i++) {
    providers.push(`Helius-${i+1}`);
  }
  
  // Chọn provider dựa trên trọng số
  let chosenProvider: string;
  
  if (providers.length >= 3) {
    // Có đủ providers để sử dụng hệ thống chọn trọng số
    chosenProvider = selectWeightedProvider('SOL', providers);
    console.log(`[SOL Weighted] Đã chọn ${chosenProvider} dựa trên trọng số thích ứng`);
  } else {
    // Sử dụng cơ chế ngẫu nhiên thông thường nếu không đủ providers
    const totalSlots = calculateTotalSolSlots();
    const randomSlot = Math.floor(Math.random() * totalSlots);
    
    if (randomSlot < publicEndpoints.length) {
      chosenProvider = publicEndpoints[randomSlot].name;
    } else {
      const keyIndex = randomSlot - publicEndpoints.length;
      chosenProvider = `Helius-${keyIndex+1}`;
    }
    
    console.log(`[SOL Random] Đã chọn ${chosenProvider} - Slot ${randomSlot + 1}/${totalSlots}`);
  }
  
  // Xử lý endpoint dựa trên provider đã chọn
  if (chosenProvider.startsWith('Helius-')) {
    // Trường hợp là một Helius API key
    const keyIndex = parseInt(chosenProvider.split('-')[1]) - 1;
    const apiKey = heliusApiKeys[keyIndex];
    
    if (!apiKey) {
      console.error(`Không tìm thấy API key cho ${chosenProvider}, sử dụng key đầu tiên`);
      const fallbackKey = heliusApiKeys[0];
      return {
        name: 'Helius-1',
        url: `https://api.helius.xyz/v0/addresses/${address}/balances?api-key=${fallbackKey}`,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      };
    }
    
    return {
      name: chosenProvider,
      url: `https://api.helius.xyz/v0/addresses/${address}/balances?api-key=${apiKey}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };
  } else {
    // Trường hợp là public endpoint
    const endpoint = publicEndpoints.find(ep => ep.name === chosenProvider);
    
    if (!endpoint) {
      // Không tìm thấy endpoint, sử dụng endpoint mặc định
      console.error(`Không tìm thấy cấu hình cho ${chosenProvider}, sử dụng endpoint mặc định`);
      const defaultEndpoint = publicEndpoints[0];
      
      return {
        name: defaultEndpoint.name,
        url: defaultEndpoint.url,
        method: defaultEndpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body: defaultEndpoint.formatBody(address)
      };
    }
    
    return {
      name: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' },
      body: endpoint.formatBody(address)
    };
  }
}

/**
 * Xử lý phản hồi từ API Solana, trả về số dư với định dạng thống nhất
 */
function parseSolanaApiResponse(name: string, data: any): string {
  if (name.startsWith('Helius')) {
    // Xử lý phản hồi từ Helius (bao gồm tất cả các key Helius)
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
 * Kiểm tra số dư Solana bằng cơ chế phân bổ ngẫu nhiên thích ứng
 * Tích hợp với hệ thống quản lý API để tối ưu hóa việc sử dụng API
 */
export async function checkSolanaBalance(address: string): Promise<string> {
  try {
    // Lấy API endpoint dựa trên trọng số thích ứng
    const apiConfig = getNextSolanaApi(address);
    
    console.log(`Checking SOL balance for ${address} using ${apiConfig.name}`);
    
    // Sử dụng checkWithBackoff để xử lý các trường hợp bị rate limit với backoff tự động
    return await checkWithBackoff(async (retryCount?: number, maxRetries?: number, retryDelay?: number): Promise<string> => {
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
          // Xử lý mã lỗi HTTP
          if (response.status === 429) {
            // Rate limit
            reportRateLimit('SOL', apiConfig.name);
            throw { status: 429, message: 'Rate limited' };
          } else if (response.status === 403 || response.status === 401) {
            // Unauthorized / Forbidden
            reportError('SOL', apiConfig.name);
            console.error(`Authentication error for ${apiConfig.name}: ${response.status}`);
            throw new Error(`Authentication error: ${response.status}`);
          } else {
            // Lỗi khác
            reportError('SOL', apiConfig.name);
            throw new Error(`HTTP error: ${response.status}`);
          }
        }
        
        const data = await response.json();
        
        // Xử lý phản hồi
        const balance = parseSolanaApiResponse(apiConfig.name, data);
        
        // Báo cáo thành công cho hệ thống quản lý API
        reportSuccess('SOL', apiConfig.name);
        
        console.log(`Solana balance from ${apiConfig.name}: ${balance}`);
        return balance;
      } catch (error: any) {
        // Xử lý các lỗi khi thực hiện request
        console.error(`Error fetching from ${apiConfig.name}:`, error);
        
        // Xử lý và báo cáo lỗi cho hệ thống quản lý
        if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
          console.error(`Rate limited on API, backing off for ${retryDelay}ms (retry ${retryCount}/${maxRetries})`);
          // Rate limit đã được báo cáo ở trên
        } else {
          // Lỗi khác (timeout, kết nối, etc)
          reportError('SOL', apiConfig.name);
        }
        
        clearTimeout(timeout);
        throw error; // Ném lỗi để cơ chế backoff hoạt động nếu cần
      }
    }, apiConfig.name, 3, 2000).catch(error => {
      // Xử lý khi tất cả các lần thử đều thất bại
      console.error(`All retries failed for ${apiConfig.name}:`, error);
      return '0'; // Trả về 0 nếu tất cả các lần thử đều thất bại
    });
  } catch (error) {
    console.error(`Error checking Solana balance:`, error);
    return '0';
  }
}