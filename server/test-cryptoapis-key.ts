/**
 * Script kiểm tra CryptoAPIs với CRYPTOAPIS_API_KEY từ environment
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

// Kiểm tra danh sách blockchain được hỗ trợ
async function testSupportedBlockchains() {
  console.log('🔍 Kiểm tra danh sách blockchain được hỗ trợ bởi CryptoAPIs');
  console.log(`🔑 API Key: ${API_KEY ? API_KEY.substring(0, 5) + '...' : 'Không có API key'}`);

  if (!API_KEY) {
    console.error('❌ Không tìm thấy API key. Vui lòng kiểm tra CRYPTOAPIS_API_KEY.');
    return;
  }

  // URL endpoint
  const url = 'https://rest.cryptoapis.io/blockchain-data';
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

// Kiểm tra tổng quát về API key
async function testGenericApiEndpoint() {
  console.log('\n🔍 Kiểm tra endpoint chung cho CryptoAPIs');

  if (!API_KEY) {
    console.error('❌ Không tìm thấy API key. Vui lòng kiểm tra CRYPTOAPIS_API_KEY.');
    return;
  }

  // URL endpoint (đường dẫn cấp cao hơn)
  const url = 'https://rest.cryptoapis.io/v2';
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

// Kiểm tra danh sách network
async function testListNetworksEndpoint() {
  console.log('\n🔍 Kiểm tra danh sách network cho CryptoAPIs');

  if (!API_KEY) {
    console.error('❌ Không tìm thấy API key. Vui lòng kiểm tra CRYPTOAPIS_API_KEY.');
    return;
  }

  // URL endpoint
  const url = 'https://rest.cryptoapis.io/v2/blockchain-data/info';
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

// Kiểm tra số dư của địa chỉ Dogecoin
async function testDogecoinBalanceEndpoint() {
  console.log('\n🔍 Kiểm tra số dư Dogecoin cho CryptoAPIs');

  if (!API_KEY) {
    console.error('❌ Không tìm thấy API key. Vui lòng kiểm tra CRYPTOAPIS_API_KEY.');
    return;
  }

  // URL endpoint - thử với đường dẫn mới
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

// Main function
async function main() {
  console.log('🚀 Bắt đầu kiểm tra CryptoAPIs với CRYPTOAPIS_API_KEY từ environment');
  
  // Kiểm tra danh sách blockchain
  await testSupportedBlockchains();
  
  // Kiểm tra endpoint chung
  await testGenericApiEndpoint();
  
  // Kiểm tra danh sách network
  await testListNetworksEndpoint();
  
  // Kiểm tra số dư Dogecoin
  await testDogecoinBalanceEndpoint();
}

// Run the main function
main().catch(error => {
  console.error('❌ Lỗi không mong muốn:', error);
});