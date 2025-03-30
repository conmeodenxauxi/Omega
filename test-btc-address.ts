import fetch from 'node-fetch';
import { getApiKey } from './server/blockchain/api-keys';

// Test với địa chỉ BTC khác
async function testBtcAddress(address: string) {
  // Dùng API BlockCypher, không phải Tatum
  const url = `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`;
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    console.log(`Checking BTC balance for ${address} via BlockCypher API`);
    const response = await fetch(url, options);
    const data = await response.json() as any;
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data && typeof data.balance === 'number') {
      console.log(`Balance: ${data.balance / 100000000} BTC (${data.balance} sats)`);
      return true;
    } else {
      console.error('Unexpected response format:', data);
      return false;
    }
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// Test với địa chỉ Satoshi
console.log("=== TESTING BTC ADDRESS Satoshi ===");
await testBtcAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

// Test với một địa chỉ BTC thực có số dư
console.log("\n=== TESTING BTC ADDRESS với số dư ===");
await testBtcAddress('1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ');