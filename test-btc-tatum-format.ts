import fetch from 'node-fetch';

// Sử dụng trực tiếp API key format mới
async function testBtcTatumApi(address: string) {
  // Sử dụng API key mới format từ apiKeys
  const apiKey = 't-67e8905d832893ddeb2bfbdd-d9ca7eea673d470d81acbe47';
  console.log(`Using BTC API Key: ${apiKey}`);
  
  const url = `https://api.tatum.io/v3/bitcoin/address/balance/${address}`;
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    }
  };

  try {
    console.log(`Checking BTC balance for ${address} via Tatum API`);
    const response = await fetch(url, options);
    console.log('Response status:', response.status);
    
    const data = await response.json() as any;
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data && typeof data.incoming === 'string' && typeof data.outgoing === 'string') {
      const incoming = BigInt(data.incoming);
      const outgoing = BigInt(data.outgoing);
      const balanceSats = Number(incoming - outgoing);
      const balanceBTC = (balanceSats / 100000000).toFixed(8);
      console.log(`Balance: ${balanceBTC} BTC (${balanceSats} sats)`);
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
console.log("=== TESTING BTC API với địa chỉ Satoshi và format key mới ===");
await testBtcTatumApi('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

// Test với một địa chỉ BTC thực có số dư
console.log("\n=== TESTING BTC API với địa chỉ có số dư ===");
await testBtcTatumApi('1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ');