/**
 * Script kiểm tra DogeChain.info API
 */

import fetch from 'node-fetch';

// Địa chỉ Dogecoin để kiểm tra
const TEST_ADDRESS = 'DQkwDpRYUyNNnoEZDfSGFFeQvLgbdEXiRd';

// Thời gian timeout
const TIMEOUT_MS = 5000;

// Function để fetch với timeout
function fetchWithTimeout(url: string, options: any, timeout = TIMEOUT_MS) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout)
    )
  ]) as Promise<Response>;
}

async function testDogeChainInfo() {
  console.log('🔍 Kiểm tra DogeChain.info API');
  console.log(`🏠 Địa chỉ: ${TEST_ADDRESS}`);

  // URL endpoint
  const url = `https://dogechain.info/api/v1/address/balance/${TEST_ADDRESS}`;
  console.log(`🌐 URL: ${url}`);

  try {
    console.log('🔄 Đang gửi request...');
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error('❌ Lỗi HTTP:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('✅ Thành công! Response data:');
    console.log(JSON.stringify(data, null, 2));

    // Extract balance if available
    if (data.balance !== undefined) {
      console.log(`💰 Số dư: ${data.balance} DOGE`);
    }
  } catch (error) {
    console.error('❌ Lỗi khi gửi request:', error);
  }
}

// Run the test
testDogeChainInfo().catch(error => {
  console.error('❌ Lỗi không mong muốn:', error);
});