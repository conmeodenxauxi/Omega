import { getApiKey, prepareApiRequest } from './server/blockchain/api-keys';
import fetch from 'node-fetch';

// Test sử dụng API key BTC qua getApiKey()
async function testBtcWithAppApi() {
  try {
    console.log("=== TESTING BTC WITH APP API ===");
    const blockchain = "BTC" as const;
    const address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"; // Satoshi's address
    
    // Lấy cấu hình API từ ứng dụng
    const apiConfig = prepareApiRequest(blockchain, address);
    console.log("API Config:", JSON.stringify(apiConfig, null, 2));
    
    // Thực hiện request
    console.log("Sending request...");
    const response = await fetch(apiConfig.url, {
      method: apiConfig.method,
      headers: apiConfig.headers,
      body: apiConfig.body
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

await testBtcWithAppApi();