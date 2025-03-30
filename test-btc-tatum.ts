import fetch from 'node-fetch';
import { getApiKey } from './server/blockchain/api-keys';

async function testBtcTatumApi(address: string) {
  const apiKey = getApiKey('BTC', 'BTC Tatum');
  console.log(`Using BTC API Key: ${apiKey.substring(0, 10)}...`);
  
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
    const data = await response.json() as any;
    
    console.log('Response status:', response.status);
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

async function testDogeTatumApi(address: string) {
  const apiKey = getApiKey('DOGE', 'Tatum');
  console.log(`Using DOGE API Key: ${apiKey.substring(0, 10)}...`);
  
  const url = `https://api.tatum.io/v3/dogecoin/address/balance/${address}`;
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    }
  };

  try {
    console.log(`Checking DOGE balance for ${address} via Tatum API`);
    const response = await fetch(url, options);
    const data = await response.json() as any;
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data && typeof data.incoming === 'string' && typeof data.outgoing === 'string') {
      const incoming = parseFloat(data.incoming);
      const outgoing = parseFloat(data.outgoing);
      const balance = (incoming - outgoing).toFixed(8);
      console.log(`Balance: ${balance} DOGE`);
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
console.log("=== TESTING BTC API với địa chỉ Satoshi ===");
await testBtcTatumApi('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

// Test với một địa chỉ DOGE thực
console.log("\n=== TESTING DOGE API ===");
await testDogeTatumApi('DDTtqnuZ5kfRT5qh2c7sNtqrJmV3iXYdGG');