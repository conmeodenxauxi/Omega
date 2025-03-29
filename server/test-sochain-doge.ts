/**
 * Script kiểm tra API SoChain cho Dogecoin
 */

import fetch from 'node-fetch';

// Địa chỉ Dogecoin để kiểm tra
const TEST_ADDRESS = 'DQkwDpRYUyNNnoEZDfSGFFeQvLgbdEXiRd';

// Thời gian timeout
const TIMEOUT_MS = 10000;

// Function để fetch với timeout
function fetchWithTimeout(url: string, options: any, timeout = TIMEOUT_MS) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout)
    )
  ]) as Promise<Response>;
}

async function testSoChainForDogecoin() {
  console.log('🔍 Kiểm tra SoChain cho Dogecoin');
  console.log(`🏠 Địa chỉ: ${TEST_ADDRESS}`);

  // URL endpoint
  const url = `https://sochain.com/api/v2/get_address_balance/DOGE/${TEST_ADDRESS}`;
  console.log(`🌐 URL: ${url}`);

  try {
    console.log('🔄 Đang gửi request...');
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Lỗi HTTP: ${response.status} - ${response.statusText}`);
      
      try {
        const errorData = await response.json();
        console.error('📝 Chi tiết lỗi:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('📝 Không thể đọc chi tiết lỗi từ response');
        const text = await response.text();
        console.error('📝 Response text:', text);
      }
      
      return;
    }

    const data = await response.json();
    console.log('✅ Thành công! Response data:');
    console.log(JSON.stringify(data, null, 2));

    // Extract balance
    if (data.data && data.data.confirmed_balance) {
      console.log(`💰 Số dư: ${data.data.confirmed_balance} DOGE`);
    }
  } catch (error) {
    console.error('❌ Lỗi khi gửi request:', error);
  }
}

// Run the test
async function main() {
  console.log('🚀 Bắt đầu kiểm tra SoChain cho Dogecoin');
  await testSoChainForDogecoin();
}

// Run the main function
main().catch(error => {
  console.error('❌ Lỗi không mong muốn:', error);
});