/**
 * Kiểm tra đơn giản cho cơ chế xoay vòng thông minh Bitcoin
 */

import { checkBitcoinBalance } from './server/blockchain/api-smart-rotation-btc';

async function testSimpleBitcoinBalance() {
  console.log('== KIỂM TRA ĐƠN GIẢN CHO CƠ CHẾ XOAY VÒNG BITCOIN ==');
  
  // Địa chỉ Bitcoin trống để test nhanh
  const testAddress = '1BitcoinEaterAddressDontSendf59kuE';
  
  try {
    console.log(`Kiểm tra địa chỉ: ${testAddress}`);
    const balance = await checkBitcoinBalance(testAddress);
    console.log(`Thành công! Số dư: ${balance} BTC`);
  } catch (error) {
    console.error(`Lỗi: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  console.log('== KIỂM TRA HOÀN TẤT ==');
}

// Chạy test
testSimpleBitcoinBalance().catch(error => {
  console.error('Lỗi trong quá trình kiểm tra:', error);
});