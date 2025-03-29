/**
 * Script kiểm tra CryptoAPIs.io cho Dogecoin
 */

import 'dotenv/config';
import * as process from 'process';

// Lấy API key từ biến môi trường
const CRYPTOAPIS_API_KEY = process.env.CRYPTOAPIS_API_KEY;
const TEST_ADDRESS = "DDTtqnuZ5kfRT5qh2c7sNtqrJmV3iXYdGG"; // Địa chỉ Dogecoin để test
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

async function testCryptoApisForDogecoin() {
  console.log('=== BẮT ĐẦU KIỂM TRA CRYPTOAPIS CHO DOGECOIN ===');
  
  if (!CRYPTOAPIS_API_KEY) {
    console.error('API key không hợp lệ. Hãy kiểm tra lại biến môi trường CRYPTOAPIS_API_KEY');
    return;
  }
  
  console.log(`Địa chỉ thử nghiệm: ${TEST_ADDRESS}`);
  
  // Endpoint cho Dogecoin Mainnet
  const url = `https://rest.cryptoapis.io/v2/blockchain-data/doge/mainnet/addresses/${TEST_ADDRESS}/balance`;
  
  try {
    console.log(`URL: ${url}`);
    console.log('Gửi yêu cầu...');
    
    const startTime = Date.now();
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CRYPTOAPIS_API_KEY
      }
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`Thời gian phản hồi: ${responseTime}ms`);
    
    if (!response.ok) {
      console.log(`Lỗi HTTP: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.log(`Nội dung lỗi: ${errorText.substring(0, 500)}`);
      return;
    }
    
    const data = await response.json();
    console.log('Kết quả:');
    console.log(JSON.stringify(data, null, 2));
    
    // Kiểm tra cấu trúc phản hồi
    console.log('\n✅ API HOẠT ĐỘNG CHÍNH XÁC');
    
    // Thử phân tích cấu trúc dữ liệu
    try {
      if (data.data && data.data.item) {
        const balanceInfo = data.data.item;
        console.log('\nCấu trúc dữ liệu:');
        console.log(JSON.stringify(balanceInfo, null, 2));
        
        const balance = balanceInfo.confirmedBalance?.amount || 
                      balanceInfo.balance || 
                      balanceInfo.amount || 
                      '0';
        console.log(`\nSố dư: ${balance} DOGE`);
      }
    } catch (error) {
      console.log(`Không thể phân tích cấu trúc dữ liệu: ${error}`);
    }
  } catch (error) {
    console.log(`❌ Lỗi khi gọi API: ${error}`);
  }
  
  console.log('\n=== KẾT THÚC KIỂM TRA ===');
}

// Chạy kiểm tra
testCryptoApisForDogecoin().catch(error => {
  console.error('Lỗi không mong muốn:', error);
});