import { getApiKey, prepareApiRequest } from './server/blockchain/api-keys';
import fetch from 'node-fetch';

// Test sử dụng API key DOGE qua getApiKey()
async function testDogeWithAppApi() {
  try {
    console.log("=== TESTING DOGE WITH APP API ===");
    const blockchain = "DOGE" as const;
    const address = "DDTtqnuZ5kfRT5qh2c7sNtqrJmV3iXYdGG";
    
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

await testDogeWithAppApi();