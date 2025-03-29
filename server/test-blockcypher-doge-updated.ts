/**
 * Script kiểm tra BlockCypher cho Dogecoin - Phiên bản cập nhật
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

async function testBlockCypherForDogecoin() {
  console.log('🔍 Kiểm tra BlockCypher cho Dogecoin');
  console.log(`🏠 Địa chỉ: ${TEST_ADDRESS}`);

  // URL endpoint
  const url = `https://api.blockcypher.com/v1/doge/main/addrs/${TEST_ADDRESS}/balance`;
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
    if (data.balance !== undefined) {
      const balanceDoge = data.balance / 100000000; // Convert satoshis to DOGE
      console.log(`💰 Số dư: ${balanceDoge} DOGE (${data.balance} satoshis)`);
    }
  } catch (error) {
    console.error('❌ Lỗi khi gửi request:', error);
  }
}

// Kiểm tra với một token để tránh rate limit
async function testBlockCypherWithToken() {
  console.log('\n🔍 Kiểm tra BlockCypher với token để tránh rate limit');
  
  // Token thử nghiệm
  const token = '11fe78d84a02463a98a5b031b74d42ce';
  
  // URL endpoint với token
  const url = `https://api.blockcypher.com/v1/doge/main/addrs/${TEST_ADDRESS}/balance?token=${token}`;
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
    if (data.balance !== undefined) {
      const balanceDoge = data.balance / 100000000; // Convert satoshis to DOGE
      console.log(`💰 Số dư: ${balanceDoge} DOGE (${data.balance} satoshis)`);
    }
  } catch (error) {
    console.error('❌ Lỗi khi gửi request:', error);
  }
}

// Run both tests
async function main() {
  console.log('🚀 Bắt đầu kiểm tra BlockCypher cho Dogecoin');
  
  // Test without token
  await testBlockCypherForDogecoin();
  
  // Test with token
  await testBlockCypherWithToken();
}

// Run the main function
main().catch(error => {
  console.error('❌ Lỗi không mong muốn:', error);
});