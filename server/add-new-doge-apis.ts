/**
 * Thêm các API mới cho Dogecoin và kiểm tra
 */

import fetch from 'node-fetch';
import { BlockchainType } from '@shared/schema';
import { blockchainEndpoints } from './blockchain/api-keys';

// Địa chỉ Dogecoin để kiểm tra (địa chỉ nổi tiếng với số dư lớn)
const TEST_ADDRESS = 'DDTtqnuZ5kfRT5qh2c7sNtqrJmV3iXYdGG';

// Timeout cho API call 
const TIMEOUT_MS = 15000;

// Tạo AbortController để timeout
function fetchWithTimeout(url: string, options: any, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
}

// Các RPC public mới cho Dogecoin
const newDogeEndpoints = [
  // Nownodes.io BTC API được áp dụng cho DOGE (thử nghiệm)
  {
    name: 'Nownodes BTC for DOGE',
    type: 'private',
    url: '',
    formatUrl: (address: string) => `https://btc.nownodes.io/api/v2/address/${address}?api_key=4eea1226-2f22-44af-9a91-5c61f2c82a9d`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    needsApiKey: true,
    callCount: 0
  },
  
  // Nownodes.io API cho Dogecoin (cách khác)
  {
    name: 'Nownodes Alt DOGE', 
    type: 'private',
    url: '',
    formatUrl: (address: string) => `https://api.nownodes.io/v1/doge/address/${address}`,
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'api-key': '4eea1226-2f22-44af-9a91-5c61f2c82a9d'
    },
    needsApiKey: true,
    callCount: 0
  },
  
  // Thử lại DogeChain nhưng với API path khác
  {
    name: 'DogeChain Alt',
    type: 'public',
    url: '',
    formatUrl: (address: string) => `https://dogechain.info/api/v1/address/balance/${address}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    needsApiKey: false,
    callCount: 0
  }
];

// Kiểm tra một API mới
async function testNewAPI(endpoint: any): Promise<void> {
  console.log(`\n=== KIỂM TRA API MỚI: ${endpoint.name} ===`);
  console.log(`Địa chỉ thử nghiệm: ${TEST_ADDRESS}`);
  
  const url = endpoint.formatUrl(TEST_ADDRESS);
  const method = endpoint.method || 'GET';
  const headers = endpoint.headers || { 'Content-Type': 'application/json' };
  
  console.log(`URL: ${url}`);
  console.log(`Method: ${method}`);
  
  try {
    const startTime = Date.now();
    
    const response = await fetchWithTimeout(url, {
      method,
      headers
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`Thời gian phản hồi: ${responseTime}ms`);
    
    if (!response.ok) {
      console.log(`Lỗi HTTP: ${response.status} - ${response.statusText}`);
      try {
        const text = await response.text();
        console.log(`Nội dung lỗi: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
      } catch (error) {
        console.log('Không thể đọc nội dung phản hồi');
      }
      return;
    }
    
    try {
      const data = await response.json();
      console.log('Kết quả:');
      console.log(JSON.stringify(data, null, 2).substring(0, 500) + (JSON.stringify(data).length > 500 ? '...' : ''));
      console.log('\n✅ API HOẠT ĐỘNG - có thể phân tích cấu trúc dữ liệu sau');
    } catch (jsonError) {
      console.log(`❌ Lỗi khi phân tích JSON: ${jsonError}`);
      try {
        const text = await response.text();
        console.log(`Phản hồi thô: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
      } catch (error) {
        console.log('Không thể đọc nội dung phản hồi');
      }
    }
  } catch (error) {
    console.log(`❌ Lỗi khi gọi API: ${error}`);
  }
  
  console.log('\n=== KẾT THÚC KIỂM TRA ===');
}

// Kiểm tra tất cả API mới
async function testAllNewAPIs(): Promise<void> {
  console.log('=== BẮT ĐẦU KIỂM TRA CÁC API DOGECOIN MỚI ===\n');
  
  for (const endpoint of newDogeEndpoints) {
    await testNewAPI(endpoint);
  }
  
  console.log('\n=== KẾT THÚC KIỂM TRA ===');
}

// Chạy kiểm tra
testAllNewAPIs().catch(error => {
  console.error('Lỗi không mong muốn:', error);
});