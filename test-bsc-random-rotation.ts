/**
 * Script kiểm tra cơ chế xoay vòng ngẫu nhiên cho Binance Smart Chain (BSC)
 * Xoay vòng ngẫu nhiên qua tất cả các slots (public endpoints và API keys)
 */

import { checkBscBalance } from './server/blockchain/api-smart-rotation-bsc';

/**
 * Kiểm tra cơ chế xoay vòng ngẫu nhiên của BSC
 */
async function testBscRandomRotation() {
  console.log('Bắt đầu test cơ chế xoay vòng ngẫu nhiên cho BSC...');
  
  // Địa chỉ BSC để kiểm tra (Binance hot wallet)
  const address = '0x8894e0a0c962cb723c1976a4421c95949be2d4e3';
  
  console.log(`Thực hiện kiểm tra 20 lần để xác nhận tính ngẫu nhiên`);
  
  // Lưu thống kê
  const stats: Record<string, number> = {};
  
  // Kiểm tra nhiều lần để đánh giá tính ngẫu nhiên
  for (let i = 0; i < 20; i++) {
    const balance = await checkBscBalance(address);
    console.log(`Lần ${i + 1}: Balance = ${balance} BNB`);
    
    // Ghi lại thông tin slot được chọn từ log
    // Lưu ý: Thông tin slot được in ra trong hàm getNextBscApi 
    // nhưng không được trả về trực tiếp, nên chúng ta không theo dõi được ở đây
  }
  
  console.log('Hoàn thành test cơ chế xoay vòng ngẫu nhiên cho BSC');
}

// Chạy test
testBscRandomRotation().catch(console.error);