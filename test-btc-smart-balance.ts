/**
 * Script kiểm tra cơ chế kiểm tra số dư Bitcoin với xoay vòng thông minh
 */

import { checkBalanceWithSmartRotation } from './server/blockchain/api-smart-rotation';

async function testBitcoinBalance() {
  // Địa chỉ Bitcoin để kiểm tra
  const testAddresses = [
    '1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ',       // Ví có số dư
    '1BitcoinEaterAddressDontSendf59kuE',        // Địa chỉ "đốt" Bitcoin
    'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' // Ví SegWit có số dư
  ];
  
  console.log('== KIỂM TRA SỐ DƯ BITCOIN VỚI CƠ CHẾ XOAY VÒNG THÔNG MINH ==');
  
  // Lặp qua các địa chỉ test
  for (let i = 0; i < testAddresses.length; i++) {
    const address = testAddresses[i];
    console.log(`\nKiểm tra địa chỉ #${i+1}: ${address}`);
    
    try {
      const startTime = Date.now();
      const balance = await checkBalanceWithSmartRotation('BTC', address);
      const endTime = Date.now();
      
      console.log(`✅ Thành công: Số dư = ${balance} BTC (${endTime - startTime}ms)`);
    } catch (error) {
      console.error(`❌ Lỗi: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Đợi 2 giây giữa các request để tránh rate limit
    if (i < testAddresses.length - 1) {
      console.log('Đợi 2 giây...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n== KIỂM TRA HOÀN TẤT ==');
}

// Chạy test
testBitcoinBalance().catch(error => {
  console.error('Lỗi trong quá trình kiểm tra:', error);
});