/**
 * Script kiểm tra cưỡng chế API key Tatum mới cho BTC
 */

import { BlockchainType } from './shared/schema';
import { checkBitcoinBalance } from './server/blockchain/api-smart-rotation-btc';
import { getApiKey } from './server/blockchain/api-keys';

/**
 * Kiểm tra API key Tatum mới cho BTC
 */
async function testTatumBTC() {
  console.log("=".repeat(80));
  console.log("KIỂM TRA CƯỠNG CHẾ API KEY TATUM MỚI CHO BTC");
  console.log("=".repeat(80));
  
  // Địa chỉ BTC nổi tiếng để kiểm tra
  const address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"; // Satoshi's address
  
  // Lấy API key Tatum mới
  const newKey = 't-67e8b19d5953fae328c2853a-6c3e0ea944094a47b3ef59f4';
  
  console.log(`Kiểm tra địa chỉ ${address} với cơ chế xoay vòng thông minh...`);
  console.log(`API key Tatum mới: ${newKey}`);
  
  try {
    console.log("\nKiểm tra balance với cơ chế xoay vòng thông thường:");
    const balance = await checkBitcoinBalance(address);
    console.log(`Số dư BTC: ${balance}`);
    
    console.log("\nKiểm tra xem API key Tatum mới đã được thêm vào hệ thống:");
    let found = false;
    
    // Kiểm tra 20 lần để xem key mới có xuất hiện không
    for (let i = 0; i < 20; i++) {
      const key = getApiKey('BTC', 'BTC_Tatum');
      console.log(`Lần ${i+1}: API key = ${key.substring(0, 15)}...`);
      
      if (key === newKey) {
        console.log(`✅ Tìm thấy key mới ở lần thử ${i+1}!`);
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log("❌ Không tìm thấy key mới trong 20 lần thử!");
    }
    
    return { success: true, keyFound: found };
  } catch (error) {
    console.error("Lỗi khi kiểm tra API Tatum BTC:", error);
    return { success: false, keyFound: false, error };
  }
}

// Chạy kiểm tra
testTatumBTC().catch(console.error);