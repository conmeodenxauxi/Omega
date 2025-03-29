/**
 * Script kiểm tra tất cả các API cho Dogecoin với timeout ngắn hơn
 */

import fetch from 'node-fetch';

// Địa chỉ Dogecoin để kiểm tra
const TEST_ADDRESS = 'DQkwDpRYUyNNnoEZDfSGFFeQvLgbdEXiRd';

// Thời gian timeout
const TIMEOUT_MS = 3000; // timeout ngắn hơn để tránh chờ đợi lâu

// Function để fetch với timeout
function fetchWithTimeout(url: string, options: any, timeout = TIMEOUT_MS) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout)
    )
  ]) as Promise<Response>;
}

async function testEndpoint(name: string, url: string, method: string, headers: any, body: any): Promise<{success: boolean, error?: string, status?: number, data?: any}> {
  console.log(`\n🔍 Kiểm tra ${name}`);
  console.log(`🌐 URL: ${url}`);
  
  try {
    console.log('🔄 Đang gửi request...');
    const response = await fetchWithTimeout(url, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    try {
      const data = await response.text();
      try {
        const jsonData = JSON.parse(data);
        if (response.ok) {
          console.log('✅ Thành công!');
          console.log(JSON.stringify(jsonData, null, 2).substring(0, 500) + '...');
          return { success: true, status: response.status, data: jsonData };
        } else {
          console.error('❌ Lỗi:', jsonData);
          return { success: false, error: response.statusText, status: response.status, data: jsonData };
        }
      } catch (e) {
        // Không phải JSON
        if (response.ok) {
          console.log('✅ Thành công! (không phải JSON)');
          console.log(data.substring(0, 500) + '...');
          return { success: true, status: response.status, data: data };
        } else {
          console.error('❌ Lỗi (không phải JSON):', data);
          return { success: false, error: response.statusText, status: response.status, data: data };
        }
      }
    } catch (e) {
      console.error('❌ Lỗi khi đọc response:', e);
      return { success: false, error: 'Cannot read response' };
    }
  } catch (error) {
    console.error('❌ Lỗi khi gửi request:', error);
    return { success: false, error: String(error) };
  }
}

async function main() {
  console.log('===== Bắt đầu kiểm tra tất cả các API cho Dogecoin =====');
  
  // Mảng các API endpoints để thử
  const endpoints = [
    // 1. DogeChain.info
    {
      name: 'DogeChain.info',
      url: `https://dogechain.info/api/v1/address/balance/${TEST_ADDRESS}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    },
    
    // 2. SoChain
    {
      name: 'SoChain',
      url: `https://sochain.com/api/v2/get_address_balance/DOGE/${TEST_ADDRESS}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    },
    
    // 3. BlockCypher
    {
      name: 'BlockCypher',
      url: `https://api.blockcypher.com/v1/doge/main/addrs/${TEST_ADDRESS}/balance`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    },
    
    // 4. Chain.so
    {
      name: 'Chain.so',
      url: `https://chain.so/api/v2/get_address_balance/DOGE/${TEST_ADDRESS}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    },
    
    // 5. NowNodes với api-key cố định
    {
      name: 'NowNodes',
      url: `https://doge-mainnet.nownodes.io/api/v2/address/${TEST_ADDRESS}`,
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'api-key': '4eea1226-2f22-44af-9a91-5c61f2c82a9d'
      }
    },
    
    // 6. NowNodes với đường dẫn khác
    {
      name: 'NowNodes (đường dẫn khác)',
      url: `https://doge-mainnet.nownodes.io/api/address/${TEST_ADDRESS}`,
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'api-key': '4eea1226-2f22-44af-9a91-5c61f2c82a9d'
      }
    },
    
    // 7. DogeBlocks.com (nếu tồn tại)
    {
      name: 'DogeBlocks.com',
      url: `https://dogeblocks.com/api/address/${TEST_ADDRESS}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    },
    
    // 8. CryptoAPIs với CRYPTOAPIS_API_KEY từ environment
    {
      name: 'CryptoAPIs',
      url: `https://rest.cryptoapis.io/v2/blockchain-data/dogecoin/mainnet/addresses/${TEST_ADDRESS}/balance`,
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Key': process.env.CRYPTOAPIS_API_KEY || ''
      }
    }
  ];
  
  // Thử lần lượt từng endpoint
  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(
      endpoint.name, 
      endpoint.url, 
      endpoint.method, 
      endpoint.headers, 
      endpoint.body
    );
    results.push({ ...endpoint, result });
  }
  
  // Tổng kết
  console.log('\n===== Tổng kết các API đã thử =====');
  results.forEach(item => {
    const status = item.result.success ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI';
    console.log(`${status} - ${item.name} - ${item.result.status || 'N/A'} - ${item.result.error || ''}`);
  });
  
  // Kết quả cuối cùng
  const successfulApis = results.filter(item => item.result.success);
  if (successfulApis.length > 0) {
    console.log('\n✅ THÀNH CÔNG! Tìm thấy', successfulApis.length, 'API hoạt động tốt:');
    successfulApis.forEach(api => {
      console.log(`- ${api.name}`);
    });
  } else {
    console.log('\n❌ THẤT BẠI! Không tìm thấy API nào hoạt động.');
    console.log('Vui lòng kiểm tra lại kết nối mạng hoặc thử các API khác.');
  }
  
  console.log('\n===== Kết thúc kiểm tra các API =====');
}

// Run all tests
main().catch(error => {
  console.error('❌ Lỗi không mong muốn:', error);
});