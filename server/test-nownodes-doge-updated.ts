/**
 * Script kiểm tra Nownodes API cho Dogecoin với đường dẫn đã cập nhật
 */

import fetch from 'node-fetch';

// Địa chỉ Dogecoin để kiểm tra
const TEST_ADDRESS = 'DQkwDpRYUyNNnoEZDfSGFFeQvLgbdEXiRd';
const API_KEY = '4eea1226-2f22-44af-9a91-5c61f2c82a9d'; // NowNodes API key

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

async function testNownodesForDogecoin() {
  console.log('🔍 Kiểm tra NowNodes cho Dogecoin (đường dẫn đã cập nhật)');
  console.log(`🏠 Địa chỉ: ${TEST_ADDRESS}`);
  console.log(`🔑 API Key: ${API_KEY ? API_KEY.substring(0, 5) + '...' : 'Không có API key'}`);

  // URL endpoint
  const url = `https://doge-mainnet.nownodes.io/api/v2/address/${TEST_ADDRESS}`;
  console.log(`🌐 URL: ${url}`);

  // Headers
  const headers = {
    'Content-Type': 'application/json',
    'api-key': API_KEY,
    'Accept': 'application/json'
  };

  try {
    console.log('🔄 Đang gửi request...');
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: headers
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
      const balanceDoge = data.balance / 100000000; // Convert satoshis to DOGE if needed
      console.log(`💰 Số dư: ${balanceDoge} DOGE (${data.balance} satoshis)`);
    }
  } catch (error) {
    console.error('❌ Lỗi khi gửi request:', error);
  }
}

// Run the test
testNownodesForDogecoin().catch(error => {
  console.error('❌ Lỗi không mong muốn:', error);
});