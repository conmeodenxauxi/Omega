import { getApiKey } from './server/blockchain/api-keys';
import fetch from 'node-fetch';

// Test sử dụng API key BTC Tatum trực tiếp
async function testBtcTatumWithAppKey() {
  try {
    console.log("=== TESTING BTC TATUM API WITH APP KEY ===");
    const blockchain = "BTC" as const;
    const address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"; // Satoshi's address
    
    // Lấy API key từ ứng dụng
    const apiKey = getApiKey(blockchain, "BTC Tatum");
    console.log("Using API key:", apiKey);
    
    // Tạo URL và headers
    const url = `https://api.tatum.io/v3/bitcoin/address/balance/${address}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    };
    
    // Thực hiện request
    console.log("Sending request to:", url);
    console.log("With headers:", JSON.stringify(headers, null, 2));
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    console.log("Response status:", response.status);
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
    
    return true;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
}

await testBtcTatumWithAppKey();