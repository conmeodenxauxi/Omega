/**
 * Test CryptoAPIs với đường dẫn chính xác dựa trên tài liệu trả về từ /info
 */

import fetch from 'node-fetch';

// Địa chỉ Dogecoin để kiểm tra
const TEST_ADDRESS = 'DQkwDpRYUyNNnoEZDfSGFFeQvLgbdEXiRd';
const API_KEY = process.env.CRYPTOAPIS_API_KEY || '';

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

async function testAddressBalance() {
  console.log('🔍 Kiểm tra số dư địa chỉ Dogecoin với đường dẫn đúng');
  console.log(`🔑 API Key: ${API_KEY ? API_KEY.substring(0, 5) + '...' : 'Không có API key'}`);

  if (!API_KEY) {
    console.error('❌ Không tìm thấy API key. Vui lòng kiểm tra CRYPTOAPIS_API_KEY.');
    return;
  }

  // URL endpoint theo đường dẫn trong tài liệu /info
  // v2/blockchain-data/:blockchain/:network/addresses/:address/balance
  const url = `https://rest.cryptoapis.io/v2/blockchain-data/dogecoin/mainnet/addresses/${TEST_ADDRESS}/balance`;
  console.log(`🌐 URL: ${url}`);

  // Headers
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
  };

  try {
    console.log('🔄 Đang gửi request...');
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: headers
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData, null, 2);
        console.error('❌ Lỗi:', errorText);
      } catch (e) {
        errorText = await response.text();
        console.error('❌ Lỗi (text):', errorText);
      }
      return;
    }

    const data = await response.json();
    console.log('✅ Thành công! Response data:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Lỗi khi gửi request:', error);
  }
}

// Thử endpoint lấy giao dịch
async function testAddressTransactions() {
  console.log('\n🔍 Kiểm tra giao dịch của địa chỉ Dogecoin');

  if (!API_KEY) {
    console.error('❌ Không tìm thấy API key. Vui lòng kiểm tra CRYPTOAPIS_API_KEY.');
    return;
  }

  // URL endpoint theo đường dẫn trong tài liệu /info
  // v2/blockchain-data/:blockchain/:network/addresses/:address/transactions
  const url = `https://rest.cryptoapis.io/v2/blockchain-data/dogecoin/mainnet/addresses/${TEST_ADDRESS}/transactions`;
  console.log(`🌐 URL: ${url}`);

  // Headers
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
  };

  try {
    console.log('🔄 Đang gửi request...');
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: headers
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData, null, 2);
        console.error('❌ Lỗi:', errorText);
      } catch (e) {
        errorText = await response.text();
        console.error('❌ Lỗi (text):', errorText);
      }
      return;
    }

    const data = await response.json();
    console.log('✅ Thành công! Response data:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Lỗi khi gửi request:', error);
  }
}

// Main function
async function main() {
  console.log('🚀 Bắt đầu kiểm tra CryptoAPIs với đường dẫn chính xác');
  
  // Kiểm tra số dư
  await testAddressBalance();
  
  // Kiểm tra giao dịch
  await testAddressTransactions();
}

// Run the main function
main().catch(error => {
  console.error('❌ Lỗi không mong muốn:', error);
});