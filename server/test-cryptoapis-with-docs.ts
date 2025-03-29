/**
 * Script kiểm tra CryptoAPIs với tài liệu chính thức
 * Tham khảo: https://developers.cryptoapis.io/technical-documentation/general-information/overview
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

// Thử với cấu trúc API mới từ tài liệu
// https://developers.cryptoapis.io/technical-documentation/blockchain-data/address/get-address-details
async function testAddressDetails() {
  console.log('🔍 Kiểm tra chi tiết địa chỉ Dogecoin theo tài liệu mới');
  console.log(`🔑 API Key: ${API_KEY ? API_KEY.substring(0, 5) + '...' : 'Không có API key'}`);

  if (!API_KEY) {
    console.error('❌ Không tìm thấy API key. Vui lòng kiểm tra CRYPTOAPIS_API_KEY.');
    return;
  }

  // URL endpoint theo tài liệu mới
  const url = `https://rest.cryptoapis.io/blockchain-data/dogecoin/mainnet/addresses/${TEST_ADDRESS}`;
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

// Kiểm tra thông tin API
async function testApiInfo() {
  console.log('\n🔍 Kiểm tra thông tin API theo tài liệu mới');

  if (!API_KEY) {
    console.error('❌ Không tìm thấy API key. Vui lòng kiểm tra CRYPTOAPIS_API_KEY.');
    return;
  }

  // URL endpoint theo tài liệu mới
  const url = 'https://rest.cryptoapis.io/info';
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

// Thử với tài liệu về List supported assets
async function testListAssets() {
  console.log('\n🔍 Kiểm tra danh sách tài sản được hỗ trợ');

  if (!API_KEY) {
    console.error('❌ Không tìm thấy API key. Vui lòng kiểm tra CRYPTOAPIS_API_KEY.');
    return;
  }

  // URL endpoint theo tài liệu mới
  const url = 'https://rest.cryptoapis.io/blockchain-data/assets';
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
  console.log('🚀 Bắt đầu kiểm tra CryptoAPIs với tài liệu mới');
  
  // Kiểm tra chi tiết địa chỉ
  await testAddressDetails();
  
  // Kiểm tra thông tin API
  await testApiInfo();
  
  // Kiểm tra danh sách tài sản
  await testListAssets();
}

// Run the main function
main().catch(error => {
  console.error('❌ Lỗi không mong muốn:', error);
});