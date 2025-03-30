/**
 * Cơ chế xoay vòng thông minh dành riêng cho Binance Smart Chain (BSC)
 * Xoay vòng qua tất cả các endpoint và API key có sẵn, mỗi lần chỉ gọi 1 request
 */
import { getApiKey } from "./api-keys";
import fetch from "node-fetch";

// Lưu trữ vị trí hiện tại trong bánh xe xoay vòng
let currentBSCSlot = 0;

// Thông tin các API key BSCScan
const bscscanApiKeys: string[] = [
  // API keys lấy từ hệ thống xoay vòng
  getApiKey('BSC', 'BSCScan_1'),
  getApiKey('BSC', 'BSCScan_2'),
  getApiKey('BSC', 'BSCScan_3'),
  getApiKey('BSC', 'BSCScan_4'),
  getApiKey('BSC', 'BSCScan_5'),
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
 * Tính toán tổng số slot cho vòng xoay BSC
 * RPC public không cần key được tính là 1 slot
 * Mỗi API key riêng cũng được tính là 1 slot
 */
function calculateTotalBscSlots(): number {
  // Public endpoints + BSCScan API keys
  return publicEndpoints.length + bscscanApiKeys.length;
}

/**
 * Lấy cấu hình API tiếp theo cho BSC theo vòng xoay
 * Đảm bảo mỗi request chỉ gọi 1 API duy nhất
 */
function getNextBscApi(address: string): {
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
  
  // Xoay vòng qua các slot
  const currentSlot = currentBSCSlot % totalSlots;
  currentBSCSlot = (currentBSCSlot + 1) % totalSlots;
  
  console.log(`BSC rotation slot: ${currentSlot + 1}/${totalSlots}`);
  
  // Trường hợp slot là public endpoint
  if (currentSlot < publicEndpoints.length) {
    const endpoint = publicEndpoints[currentSlot];
    console.log(`[BSC Rotation] Đã chọn ${endpoint.name} (public endpoint) - Slot ${currentSlot + 1}/${totalSlots}`);
    
    return {
      name: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' },
      body: endpoint.formatBody(address)
    };
  }
  
  // Trường hợp slot là BSCScan API key
  const keyIndex = currentSlot - publicEndpoints.length;
  const apiKey = bscscanApiKeys[keyIndex];
  
  console.log(`[BSC Rotation] Đã chọn BSCScan với API key ${apiKey.substring(0, 6)}... - Slot ${currentSlot + 1}/${totalSlots}`);
  
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
 * Kiểm tra số dư BSC bằng cơ chế xoay vòng tuần tự (chỉ 1 request mỗi lần)
 */
export async function checkBscBalance(address: string): Promise<string> {
  try {
    // Lấy API endpoint tiếp theo từ vòng xoay
    const apiConfig = getNextBscApi(address);
    
    console.log(`Checking BSC balance for ${address} using ${apiConfig.name}`);
    
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
    const balance = parseBscApiResponse(apiConfig.name, data);
    
    console.log(`BSC balance from ${apiConfig.name}: ${balance}`);
    return balance;
  } catch (error) {
    console.error(`Error fetching from ${error instanceof Error ? error.message : 'unknown'}`);
    return '0';
  }
}