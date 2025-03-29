/**
 * Script kiểm tra Nownodes API cho Dogecoin
 */

import 'dotenv/config';
import * as process from 'process';

// Địa chỉ Dogecoin để test
const TEST_ADDRESS = "DDTtqnuZ5kfRT5qh2c7sNtqrJmV3iXYdGG"; 
const NOWNODES_API_KEY = "4eea1226-2f22-44af-9a91-5c61f2c82a9d";
const TIMEOUT_MS = 10000; // 10 giây

// Fetch with timeout để tránh treo quá lâu
function fetchWithTimeout(url: string, options: any, timeout = TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
}

async function testNownodesForDogecoin() {
  console.log('=== BẮT ĐẦU KIỂM TRA NOWNODES CHO DOGECOIN ===');
  
  console.log(`Địa chỉ thử nghiệm: ${TEST_ADDRESS}`);
  
  // Danh sách các endpoint cần thử
  const endpoints = [
    {
      name: "Nownodes API v1",
      url: `https://doge.nownodes.io/api/v1/address/${TEST_ADDRESS}`
    },
    {
      name: "Nownodes API v2 - address",
      url: `https://doge.nownodes.io/api/v2/address/${TEST_ADDRESS}`
    },
    {
      name: "Nownodes node - getaddressbalance",
      url: `https://doge.nownodes.io/node/getaddressbalance/${TEST_ADDRESS}`
    },
    {
      name: "Nownodes node ext - getaddressbalance",
      url: `https://doge.nownodes.io/node/ext/getaddressbalance/${TEST_ADDRESS}`
    },
    {
      name: "Nownodes POST - getaddressbalance", 
      method: "POST",
      url: `https://doge.nownodes.io/node/ext`,
      body: JSON.stringify({
        "jsonrpc": "1.0",
        "id": "testnet",
        "method": "getaddressbalance",
        "params": [TEST_ADDRESS]
      })
    }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n--- ĐANG THỬ NGHIỆM: ${endpoint.name} ---`);
    console.log(`URL: ${endpoint.url}`);
    console.log(`Phương thức: ${endpoint.method || 'GET'}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetchWithTimeout(endpoint.url, {
        method: endpoint.method || 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'api-key': NOWNODES_API_KEY
        },
        body: endpoint.method === 'POST' ? endpoint.body : undefined
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`Thời gian phản hồi: ${responseTime}ms`);
      
      if (!response.ok) {
        console.log(`Lỗi HTTP: ${response.status} - ${response.statusText}`);
        try {
          const text = await response.text();
          console.log(`Nội dung lỗi: ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`);
        } catch (error) {
          console.log('Không thể đọc nội dung phản hồi');
        }
        continue;
      }
      
      try {
        const data = await response.json();
        console.log('Kết quả:');
        console.log(JSON.stringify(data, null, 2).substring(0, 500) + (JSON.stringify(data).length > 500 ? '...' : ''));
        console.log('✅ API HOẠT ĐỘNG CHÍNH XÁC');
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
  }
  
  console.log('\n=== KẾT THÚC KIỂM TRA ===');
}

// Chạy kiểm tra
testNownodesForDogecoin().catch(error => {
  console.error('Lỗi không mong muốn:', error);
});