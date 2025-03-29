/**
 * File kiểm tra các RPC của Dogecoin
 * Script này sẽ kiểm tra từng RPC và hiển thị kết quả
 */

import fetch from 'node-fetch';
import { BlockchainType } from '@shared/schema';
import { blockchainEndpoints } from './blockchain/api-keys';

// Địa chỉ Dogecoin nổi tiếng có số dư để kiểm tra
const testDogeAddresses = [
  'D6GMuUd4JsaLCNPzDSGmGRbW8dGxdthYyT', // Dogecoin cold wallet của Binance
  'DKnq5PcGEf1RnvdcTNiwTsNsdMWGV326S8', // Dogecoin cold wallet khác
  'D8bYFkBvb4BTEsQN7YnQvGQDRaNwbtYXz7', // Một địa chỉ Doge có lịch sử giao dịch
  'D7Fat6b6rBSs8yK21LM9goMGkJ6mxTQacc'  // Địa chỉ trong ứng dụng
];

// Đặt timeout ngắn hơn cho các request
const TIMEOUT_MS = 5000;

// Tạo AbortController để timeout
function fetchWithTimeout(url: string, options: any, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
}

// Hàm phân tích kết quả
function parseBalance(name: string, data: any, address: string): { success: boolean, balance: string } {
  let balance = '0';
  let success = false;
  
  try {
    if (name === 'Blockchair') {
      if (data.data && data.data[address]) {
        balance = String(data.data[address].address.balance / 100000000);
        success = true;
      }
    } else if (name === 'SoChain') {
      if (data.status === 'success') {
        balance = data.data.confirmed_balance || '0';
        success = true;
      }
    } else if (name === 'DogeChain') {
      if (data.success === 1) {
        balance = data.balance || '0';
        success = true;
      }
    } else if (name === 'BlockCypher DOGE') {
      if (data.balance !== undefined) {
        balance = String(data.balance / 100000000);
        success = true;
      }
    } else if (name === 'Chain.so') {
      if (data.status === 'success') {
        balance = data.data.confirmed_balance || '0';
        success = true;
      }
    } else if (name === 'DOGE-RPC-1') {
      if (data.address && data.balance !== undefined) {
        balance = String(data.balance);
        success = true;
      }
    } else if (name === 'DOGE-RPC-2') {
      if (data.balance !== undefined) {
        balance = String(data.balance);
        success = true;
      }
    } else if (name === 'CryptoAPIs') {
      if (data.apiVersion && data.data && data.data.item) {
        balance = data.data.item.confirmedBalance || '0';
        success = true;
      }
    }
    
    return { success, balance };
  } catch (error) {
    return { success: false, balance: '0' };
  }
}

// Kiểm tra một endpoint
async function testEndpoint(name: string, url: string, method: string, headers: any, body: any): Promise<any> {
  console.log(`\nKiểm tra ${name}:`);
  console.log(`URL: ${url}`);
  
  try {
    const startTime = Date.now();
    
    const response = await fetchWithTimeout(url, {
      method,
      headers,
      body
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`Thời gian phản hồi: ${responseTime}ms`);
    
    if (!response.ok) {
      console.log(`Lỗi: ${response.status} - ${response.statusText}`);
      return { success: false, error: `HTTP Error: ${response.status}` };
    }
    
    try {
      const data = await response.json();
      return { success: true, data };
    } catch (jsonError) {
      console.log(`Lỗi JSON: ${jsonError.message}`);
      return { success: false, error: 'Invalid JSON response' };
    }
  } catch (error) {
    console.log(`Lỗi khi gọi API: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Kiểm tra từng endpoint riêng lẻ
async function testSingleEndpoint(address: string, endpointName: string): Promise<void> {
  const endpoints = blockchainEndpoints['DOGE'];
  const endpoint = endpoints.find(e => e.name === endpointName);
  
  if (!endpoint) {
    console.log(`Không tìm thấy endpoint: ${endpointName}`);
    return;
  }
  
  // Chuẩn bị URL và headers
  const url = endpoint.formatUrl ? endpoint.formatUrl(address) : endpoint.url;
  const headers = endpoint.headers || { 'Content-Type': 'application/json' };
  const body = endpoint.formatBody ? endpoint.formatBody(address) : undefined;
  const method = endpoint.method || 'GET';
  
  // Kiểm tra endpoint
  const result = await testEndpoint(endpointName, url, method, headers, body);
  
  if (result.success) {
    console.log('Kết quả:');
    console.log(JSON.stringify(result.data, null, 2).substring(0, 500));
    
    const parsedResult = parseBalance(endpointName, result.data, address);
    console.log(`\nTrạng thái: ${parsedResult.success ? 'THÀNH CÔNG ✅' : 'THẤT BẠI ❌'}`);
    if (parsedResult.success) {
      console.log(`Số dư: ${parsedResult.balance} DOGE`);
    }
  }
}

// Phân tích tham số dòng lệnh
async function main(): Promise<void> {
  console.log('=== KIỂM TRA DOGE BLOCKCHAIN RPCs ===');
  
  // Lấy danh sách các endpoint
  const endpoints = blockchainEndpoints['DOGE'];
  const endpointNames = endpoints.map(e => e.name);
  console.log('Các endpoint có sẵn:', endpointNames.join(', '));
  
  // Sử dụng địa chỉ Dogecoin đầu tiên
  const address = testDogeAddresses[0];
  console.log(`\nĐịa chỉ thử nghiệm: ${address}`);
  
  console.log('\n=== KẾT QUẢ KIỂM TRA ===');
  
  // Kiểm tra lần lượt từng endpoint
  for (const name of endpointNames) {
    await testSingleEndpoint(address, name);
    console.log('---------------------------');
  }
  
  console.log('\n=== KẾT THÚC KIỂM TRA ===');
}

// Chạy script
main().catch(error => {
  console.error('Lỗi khi chạy kiểm tra:', error);
});