import fetch from 'node-fetch';
import { getApiKey } from './server/blockchain/api-keys';

// Test DOGE API với hàm getApiKey
async function testDogeWithGetApiKey() {
  const apiKey = getApiKey('DOGE', 'Tatum');
  console.log(`Đã lấy DOGE API Key: ${apiKey.substring(0, 10)}...`);
  
  const url = `https://api.tatum.io/v3/dogecoin/address/balance/DDTtqnuZ5kfRT5qh2c7sNtqrJmV3iXYdGG`;
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    }
  };

  try {
    console.log('Checking DOGE balance với getApiKey');
    const response = await fetch(url, options);
    console.log('Response status:', response.status);
    
    const data = await response.json() as any;
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test trực tiếp API key DOGE từ file api-keys.ts (mở rộng thử nghiệm)
async function testDirectApiKey() {
  // Kiểm tra tất cả các key DOGE
  const keyProvider = 'DOGE_TATUM';
  console.log('\n=== KIỂM TRA TẤT CẢ CÁC KEY TATUM DOGE ===');
  
  // Import trực tiếp apiKeys từ file api-keys.ts
  const { apiKeys } = await import('./server/blockchain/api-keys');
  
  if (apiKeys[keyProvider] && apiKeys[keyProvider].length > 0) {
    console.log(`Tìm thấy ${apiKeys[keyProvider].length} key cho ${keyProvider}`);
    
    // Thử key đầu tiên
    const firstKey = apiKeys[keyProvider][0];
    console.log(`Thử key đầu tiên: ${firstKey.substring(0, 10)}...`);
    
    const url = `https://api.tatum.io/v3/dogecoin/address/balance/DDTtqnuZ5kfRT5qh2c7sNtqrJmV3iXYdGG`;
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': firstKey
      }
    };
    
    const response = await fetch(url, options);
    console.log('Response status:', response.status);
    
    const data = await response.json() as any;
    console.log('Response data:', JSON.stringify(data, null, 2));
  } else {
    console.log(`Không tìm thấy key nào cho ${keyProvider}`);
  }
}

// Thử cả hai phương pháp
await testDogeWithGetApiKey();
await testDirectApiKey();