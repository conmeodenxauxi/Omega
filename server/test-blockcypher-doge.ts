/**
 * Script kiểm tra BlockCypher cho Dogecoin
 */

import 'dotenv/config';
import * as process from 'process';

// Địa chỉ Dogecoin để test
const TEST_ADDRESS = "DDTtqnuZ5kfRT5qh2c7sNtqrJmV3iXYdGG"; 
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

async function testBlockCypherForDogecoin() {
  console.log('=== BẮT ĐẦU KIỂM TRA BLOCKCYPHER CHO DOGECOIN ===');
  
  console.log(`Địa chỉ thử nghiệm: ${TEST_ADDRESS}`);
  
  const url = `https://api.blockcypher.com/v1/doge/main/addrs/${TEST_ADDRESS}/balance`;
  console.log(`URL: ${url}`);
  console.log('Gửi yêu cầu...');
  
  try {
    const startTime = Date.now();
    
    const response = await fetchWithTimeout(url, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`Thời gian phản hồi: ${responseTime}ms`);
    
    if (!response.ok) {
      console.log(`Lỗi HTTP: ${response.status} - ${response.statusText}`);
      try {
        const text = await response.text();
        console.log(`Nội dung lỗi: ${text}`);
      } catch (error) {
        console.log('Không thể đọc nội dung phản hồi lỗi');
      }
      console.log('\n❌ API KHÔNG HOẠT ĐỘNG ĐÚNG CÁCH');
      return;
    }
    
    const data = await response.json();
    console.log('Kết quả:');
    console.log(JSON.stringify(data, null, 2));
    
    // Phân tích kết quả
    if (data && (data.balance !== undefined || data.final_balance !== undefined)) {
      const balance = data.balance !== undefined ? data.balance : data.final_balance;
      const confirmedBalance = data.confirmed_balance || data.balance || 0;
      const txCount = data.n_tx || data.txrefs?.length || 0;
      
      console.log(`\nSố dư: ${balance / 100000000} DOGE`);
      console.log(`Số dư đã xác nhận: ${confirmedBalance / 100000000} DOGE`);
      console.log(`Số lượng giao dịch: ${txCount}`);
      
      console.log('\n✅ API HOẠT ĐỘNG CHÍNH XÁC');
    } else {
      console.log('\n⚠️ API trả về dữ liệu không như mong đợi');
    }
  } catch (error) {
    console.log(`❌ Lỗi khi gọi API: ${error}`);
  }
  
  console.log('\n=== KẾT THÚC KIỂM TRA ===');
}

// Chạy kiểm tra
testBlockCypherForDogecoin().catch(error => {
  console.error('Lỗi không mong muốn:', error);
});