/**
 * Script kiểm tra CryptoAPIs với thông tin chi tiết từ API response
 */

import fetch from 'node-fetch';

// Địa chỉ Dogecoin để kiểm tra
const TEST_ADDRESS = 'DQkwDpRYUyNNnoEZDfSGFFeQvLgbdEXiRd';

// Thời gian timeout
const TIMEOUT_MS = 15000;

// Function để fetch với timeout
function fetchWithTimeout(url: string, options: any, timeout = TIMEOUT_MS) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout)
    )
  ]) as Promise<Response>;
}

/**
 * Kiểm tra endpoint balance của CryptoAPIs với đường dẫn đã cập nhật
 */
async function testCryptoApisBalanceEndpoint() {
  console.log('🔍 Kiểm tra CryptoAPIs Balance endpoint (đường dẫn đã cập nhật)');
  console.log(`🏠 Địa chỉ: ${TEST_ADDRESS}`);

  // Lấy API key từ environment variable
  const apiKey = process.env.CRYPTOAPIS_API_KEY || '';
  if (!apiKey) {
    console.error('❌ CRYPTOAPIS_API_KEY không được cung cấp trong environment variables');
    return;
  }
  console.log(`🔑 API Key: ${apiKey.substring(0, 5)}...`);

  // URL endpoint - đường dẫn đã được cập nhật theo tài liệu mới nhất
  const url = `https://rest.cryptoapis.io/v2/blockchain-data/dogecoin/mainnet/addresses/${TEST_ADDRESS}/balance`;
  console.log(`🌐 URL: ${url}`);

  try {
    console.log('🔄 Đang gửi request...');
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      }
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    // Cố gắng đọc response body dù thành công hay thất bại
    const responseText = await response.text();
    
    try {
      // Cố gắng parse thành JSON
      const data = JSON.parse(responseText);
      console.log('📄 Response data:');
      console.log(JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        console.error('❌ Lỗi:', data.error?.message || 'Không xác định');
        console.error('📓 Chi tiết lỗi:', data.error?.details || 'Không có chi tiết');
        return;
      }
      
      // Extract balance if available
      if (data.data?.item?.confirmedBalance?.amount !== undefined) {
        console.log(`💰 Số dư: ${data.data.item.confirmedBalance.amount} DOGE`);
      }
    } catch (jsonError) {
      // Nếu không parse được JSON, hiển thị response text nguyên bản
      console.log('📝 Response text (không phải JSON):');
      console.log(responseText);
    }
  } catch (error) {
    console.error('❌ Lỗi khi gửi request:', error);
  }
}

async function testCryptoApisListEndpoint() {
  console.log('\n🔍 Kiểm tra CryptoAPIs List supported assets endpoint');

  // Lấy API key từ environment variable
  const apiKey = process.env.CRYPTOAPIS_API_KEY || '';
  if (!apiKey) {
    console.error('❌ CRYPTOAPIS_API_KEY không được cung cấp trong environment variables');
    return;
  }

  // URL endpoint - thử endpoint liệt kê blockchain được hỗ trợ
  const url = `https://rest.cryptoapis.io/v2/blockchain-data/info`;
  console.log(`🌐 URL: ${url}`);

  try {
    console.log('🔄 Đang gửi request...');
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      }
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    // Cố gắng đọc response body dù thành công hay thất bại
    const responseText = await response.text();
    
    try {
      // Cố gắng parse thành JSON
      const data = JSON.parse(responseText);
      console.log('📄 Response data:');
      console.log(JSON.stringify(data, null, 2));
    } catch (jsonError) {
      // Nếu không parse được JSON, hiển thị response text nguyên bản
      console.log('📝 Response text (không phải JSON):');
      console.log(responseText);
    }
  } catch (error) {
    console.error('❌ Lỗi khi gửi request:', error);
  }
}

async function testCryptoApisAvailableEndpoints() {
  console.log('\n🔍 Kiểm tra CryptoAPIs Available Endpoints cho Dogecoin');

  // Lấy API key từ environment variable
  const apiKey = process.env.CRYPTOAPIS_API_KEY || '';
  if (!apiKey) {
    console.error('❌ CRYPTOAPIS_API_KEY không được cung cấp trong environment variables');
    return;
  }

  // URL endpoint - thử endpoint liệt kê các endpoints cho Dogecoin
  const url = `https://rest.cryptoapis.io/v2/blockchain-data/dogecoin/mainnet/info`;
  console.log(`🌐 URL: ${url}`);

  try {
    console.log('🔄 Đang gửi request...');
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      }
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    // Cố gắng đọc response body dù thành công hay thất bại
    const responseText = await response.text();
    
    try {
      // Cố gắng parse thành JSON
      const data = JSON.parse(responseText);
      console.log('📄 Response data:');
      console.log(JSON.stringify(data, null, 2));
    } catch (jsonError) {
      // Nếu không parse được JSON, hiển thị response text nguyên bản
      console.log('📝 Response text (không phải JSON):');
      console.log(responseText);
    }
  } catch (error) {
    console.error('❌ Lỗi khi gửi request:', error);
  }
}

async function main() {
  console.log('===== Bắt đầu kiểm tra CryptoAPIs =====');
  
  // Kiểm tra API key tồn tại
  const apiKey = process.env.CRYPTOAPIS_API_KEY;
  if (!apiKey) {
    console.error('❌ CRYPTOAPIS_API_KEY không tồn tại trong environment variables');
    console.error('Vui lòng thêm CRYPTOAPIS_API_KEY vào environment variables và chạy lại');
    return;
  }

  // Kiểm tra endpoint balance
  await testCryptoApisBalanceEndpoint();
  
  // Kiểm tra endpoint list
  await testCryptoApisListEndpoint();
  
  // Kiểm tra endpoint available endpoints
  await testCryptoApisAvailableEndpoints();
  
  console.log('===== Kết thúc kiểm tra CryptoAPIs =====');
}

// Run all tests
main().catch(error => {
  console.error('❌ Lỗi không mong muốn:', error);
});