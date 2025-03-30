/**
 * Cơ chế xoay vòng thông minh dành riêng cho Ethereum
 * Xoay vòng qua tất cả các endpoint và API key có sẵn, mỗi lần chỉ gọi 1 request
 */
import { getApiKey } from "./api-keys";
import fetch from "node-fetch";

// Lưu trữ vị trí hiện tại trong bánh xe xoay vòng
let currentETHSlot = 0;

// Thông tin các API key Etherscan
const etherscanApiKeys: string[] = [
  // API keys lấy từ hệ thống xoay vòng
  getApiKey('ETH', 'Etherscan_1'),
  getApiKey('ETH', 'Etherscan_2'),
  getApiKey('ETH', 'Etherscan_3'),
  getApiKey('ETH', 'Etherscan_4'),
  getApiKey('ETH', 'Etherscan_5'),
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
 * Tính toán tổng số slot cho vòng xoay ETH
 * RPC public không cần key được tính là 1 slot
 * Mỗi API key riêng cũng được tính là 1 slot
 */
function calculateTotalEthSlots(): number {
  // Public endpoints + Etherscan API keys
  return publicEndpoints.length + etherscanApiKeys.length;
}

/**
 * Lấy cấu hình API tiếp theo cho Ethereum theo vòng xoay
 * Đảm bảo mỗi request chỉ gọi 1 API duy nhất
 */
function getNextEthereumApi(address: string): {
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
  
  // Xoay vòng qua các slot
  const currentSlot = currentETHSlot % totalSlots;
  currentETHSlot = (currentETHSlot + 1) % totalSlots;
  
  console.log(`ETH rotation slot: ${currentSlot + 1}/${totalSlots}`);
  
  // Trường hợp slot là public endpoint
  if (currentSlot < publicEndpoints.length) {
    const endpoint = publicEndpoints[currentSlot];
    console.log(`[ETH Rotation] Đã chọn ${endpoint.name} (public endpoint) - Slot ${currentSlot + 1}/${totalSlots}`);
    
    return {
      name: endpoint.name,
      url: endpoint.url,
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' },
      body: endpoint.formatBody(address)
    };
  }
  
  // Trường hợp slot là Etherscan API key
  const keyIndex = currentSlot - publicEndpoints.length;
  const apiKey = etherscanApiKeys[keyIndex];
  
  console.log(`[ETH Rotation] Đã chọn Etherscan với API key ${apiKey.substring(0, 6)}... - Slot ${currentSlot + 1}/${totalSlots}`);
  
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
 * Kiểm tra số dư Ethereum bằng cơ chế xoay vòng tuần tự (chỉ 1 request mỗi lần)
 */
export async function checkEthereumBalance(address: string): Promise<string> {
  try {
    // Lấy API endpoint tiếp theo từ vòng xoay
    const apiConfig = getNextEthereumApi(address);
    
    console.log(`Checking ETH balance for ${address} using ${apiConfig.name}`);
    
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
    const balance = parseEthereumApiResponse(apiConfig.name, data);
    
    console.log(`Ethereum balance from ${apiConfig.name}: ${balance}`);
    return balance;
  } catch (error) {
    console.error(`Error fetching from ${error instanceof Error ? error.message : 'unknown'}`);
    return '0';
  }
}