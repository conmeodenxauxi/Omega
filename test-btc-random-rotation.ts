/**
 * Script kiểm tra cơ chế xoay vòng ngẫu nhiên cho Bitcoin
 * Xoay vòng ngẫu nhiên qua tất cả các slots (public endpoints và API keys)
 */

import { checkBitcoinBalance } from './server/blockchain/api-smart-rotation-btc';

/**
 * Kiểm tra cơ chế xoay vòng ngẫu nhiên của Bitcoin
 */
async function testBitcoinRandomRotation() {
  console.log('Bắt đầu test cơ chế xoay vòng ngẫu nhiên cho Bitcoin...');
  
  // Địa chỉ Bitcoin để kiểm tra (Satoshi Nakamoto first mined coins)
  const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
  
  console.log(`Thực hiện kiểm tra 30 lần để xác nhận tính ngẫu nhiên`);
  
  // Lưu thống kê
  const stats: Record<string, number> = {};
  
  // Kiểm tra nhiều lần để đánh giá tính ngẫu nhiên
  for (let i = 0; i < 30; i++) {
    const balance = await checkBitcoinBalance(address);
    console.log(`Lần ${i + 1}: Balance = ${balance} BTC`);
    
    // Ghi lại thông tin slot được chọn từ log
    // Lưu ý: Thông tin slot được in ra trong hàm getNextBitcoinApi 
    // nhưng không được trả về trực tiếp, nên chúng ta không theo dõi được ở đây
  }
  
  console.log('Hoàn thành test cơ chế xoay vòng ngẫu nhiên cho Bitcoin');
}

// Chạy test
testBitcoinRandomRotation().catch(console.error);