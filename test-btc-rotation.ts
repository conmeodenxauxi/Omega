/**
 * Script kiểm tra cơ chế xoay vòng thông minh cho Bitcoin sau khi thêm key mới
 */

import { checkBalanceWithSmartRotation } from './server/blockchain/api-smart-rotation';

/**
 * Kiểm tra cơ chế xoay vòng Bitcoin
 */
async function testBitcoinRotation() {
  // Địa chỉ Bitcoin để kiểm tra
  const testAddresses = [
    '1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ',       // Ví có số dư
    '1BitcoinEaterAddressDontSendf59kuE',        // Địa chỉ "đốt" Bitcoin
    'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' // Ví SegWit có số dư
  ];
  
  const results = [];
  
  console.log('== BẮT ĐẦU KIỂM TRA CƠ CHẾ XOAY VÒNG BITCOIN ==');
  
  for (let i = 0; i < testAddresses.length; i++) {
    const address = testAddresses[i];
    console.log(`\nKiểm tra địa chỉ #${i+1}: ${address}`);
    
    try {
      const startTime = Date.now();
      const balance = await checkBalanceWithSmartRotation('BTC', address);
      const endTime = Date.now();
      
      console.log(`✅ Thành công! Số dư: ${balance} BTC (${endTime - startTime}ms)`);
      
      results.push({
        address,
        balance,
        time: endTime - startTime,
        success: true
      });
    } catch (error) {
      console.error(`❌ Lỗi: ${error instanceof Error ? error.message : String(error)}`);
      
      results.push({
        address,
        balance: '0',
        time: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Đợi 2 giây giữa các request để tránh rate limit
    if (i < testAddresses.length - 1) {
      console.log('Đợi 2 giây để tránh rate limit...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n== KẾT THÚC KIỂM TRA ==');
  console.log(`Thành công: ${results.filter(r => r.success).length}/${results.length}`);
  
  return results;
}

// Chạy kiểm tra
testBitcoinRotation().catch(error => {
  console.error('Lỗi trong quá trình kiểm tra:', error);
});