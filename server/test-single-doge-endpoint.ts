/**
 * Script kiểm tra một RPC Dogecoin cụ thể
 */

import fetch from 'node-fetch';
import { BlockchainType } from '@shared/schema';
import { blockchainEndpoints } from './blockchain/api-keys';

// Địa chỉ Dogecoin nổi tiếng
const TEST_ADDRESS = 'D7Fat6b6rBSs8yK21LM9goMGkJ6mxTQacc'; // Địa chỉ trong ứng dụng

// Timeout ngắn cho API call
const TIMEOUT_MS = 10000;

// Tạo AbortController để timeout
function fetchWithTimeout(url: string, options: any, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
}

// Lấy thông tin về RPC endpoint cần kiểm tra
function getEndpointInfo(endpointName: string) {
  const endpoints = blockchainEndpoints['DOGE'];
  const endpoint = endpoints.find(e => e.name === endpointName);
  
  if (!endpoint) {
    console.error(`Không tìm thấy endpoint: ${endpointName}`);
    console.log('Danh sách endpoint có sẵn:');
    endpoints.forEach(e => console.log(`- ${e.name}`));
    process.exit(1);
  }
  
  return endpoint;
}

// Kiểm tra một endpoint
async function testEndpoint(endpointName: string): Promise<void> {
  console.log(`\n=== TEST DOGECOIN RPC: ${endpointName} ===`);
  console.log(`Địa chỉ thử nghiệm: ${TEST_ADDRESS}\n`);
  
  const endpoint = getEndpointInfo(endpointName);
  
  // Chuẩn bị URL và headers
  const url = endpoint.formatUrl ? endpoint.formatUrl(TEST_ADDRESS) : endpoint.url;
  const headers = endpoint.headers || { 'Content-Type': 'application/json' };
  const body = endpoint.formatBody ? endpoint.formatBody(TEST_ADDRESS) : undefined;
  const method = endpoint.method || 'GET';
  
  console.log(`URL: ${url}`);
  console.log(`Method: ${method}`);
  
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
      
      // Phân tích cấu trúc dữ liệu
      console.log('\nPhân tích cấu trúc dữ liệu:');
      if (endpointName === 'Blockchair') {
        if (data.data && data.data[TEST_ADDRESS]) {
          const balance = data.data[TEST_ADDRESS].address.balance / 100000000;
          console.log(`✅ THÀNH CÔNG - Số dư: ${balance} DOGE`);
        } else {
          console.log('❌ THẤT BẠI - Không thể phân tích dữ liệu');
        }
      } else if (endpointName === 'SoChain') {
        if (data.status === 'success') {
          const balance = data.data.confirmed_balance;
          console.log(`✅ THÀNH CÔNG - Số dư: ${balance} DOGE`);
        } else {
          console.log('❌ THẤT BẠI - Không thể phân tích dữ liệu');
        }
      } else if (endpointName === 'DogeChain') {
        if (data.success === 1) {
          const balance = data.balance;
          console.log(`✅ THÀNH CÔNG - Số dư: ${balance} DOGE`);
        } else {
          console.log('❌ THẤT BẠI - Không thể phân tích dữ liệu');
        }
      } else if (endpointName === 'BlockCypher DOGE') {
        if (data.balance !== undefined) {
          const balance = data.balance / 100000000;
          console.log(`✅ THÀNH CÔNG - Số dư: ${balance} DOGE`);
        } else {
          console.log('❌ THẤT BẠI - Không thể phân tích dữ liệu');
        }
      } else if (endpointName === 'Chain.so') {
        if (data.status === 'success') {
          const balance = data.data.confirmed_balance;
          console.log(`✅ THÀNH CÔNG - Số dư: ${balance} DOGE`);
        } else {
          console.log('❌ THẤT BẠI - Không thể phân tích dữ liệu');
        }
      } else if (endpointName === 'DOGE-RPC-1') {
        if (data.address && data.balance !== undefined) {
          const balance = data.balance;
          console.log(`✅ THÀNH CÔNG - Số dư: ${balance} DOGE`);
        } else {
          console.log('❌ THẤT BẠI - Không thể phân tích dữ liệu');
        }
      } else if (endpointName === 'DOGE-RPC-2') {
        if (data.balance !== undefined) {
          const balance = data.balance;
          console.log(`✅ THÀNH CÔNG - Số dư: ${balance} DOGE`);
        } else {
          console.log('❌ THẤT BẠI - Không thể phân tích dữ liệu');
        }
      } else if (endpointName === 'CryptoAPIs') {
        if (data.apiVersion && data.data && data.data.item) {
          const balance = data.data.item.confirmedBalance;
          console.log(`✅ THÀNH CÔNG - Số dư: ${balance} DOGE`);
        } else {
          console.log('❌ THẤT BẠI - Không thể phân tích dữ liệu');
        }
      } else {
        console.log('⚠️ CẢNH BÁO - Không có logic phân tích cho endpoint này');
      }
    } catch (jsonError) {
      console.log(`❌ Lỗi khi phân tích JSON: ${jsonError.message}`);
      try {
        const text = await response.text();
        console.log(`Phản hồi thô: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
      } catch (error) {
        console.log('Không thể đọc nội dung phản hồi');
      }
    }
  } catch (error) {
    console.log(`❌ Lỗi khi gọi API: ${error.message}`);
  }
  
  console.log('\n=== KẾT THÚC KIỂM TRA ===');
}

// Kiểm tra tham số dòng lệnh
const endpointToTest = process.argv[2];

if (!endpointToTest) {
  console.log('Vui lòng cung cấp tên endpoint cần kiểm tra:');
  console.log('npx tsx server/test-single-doge-endpoint.ts <endpoint_name>');
  console.log('\nDanh sách các endpoint có sẵn:');
  
  const endpoints = blockchainEndpoints['DOGE'];
  endpoints.forEach(e => console.log(`- ${e.name}`));
  
  process.exit(1);
}

// Chạy kiểm tra
testEndpoint(endpointToTest).catch(error => {
  console.error('Lỗi không mong muốn:', error);
  process.exit(1);
});