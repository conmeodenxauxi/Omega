/**
 * Script kiểm tra cơ chế xoay vòng ngẫu nhiên cho Ethereum
 * Xoay vòng ngẫu nhiên qua tất cả các slots (public endpoints và API keys)
 */

import { checkEthereumBalance } from './server/blockchain/api-smart-rotation-eth';

/**
 * Kiểm tra cơ chế xoay vòng ngẫu nhiên của Ethereum
 */
async function testEthereumRandomRotation() {
  console.log('Bắt đầu test cơ chế xoay vòng ngẫu nhiên cho Ethereum...');
  
  // Địa chỉ Ethereum để kiểm tra (Vitalik Buterin's public address)
  const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
  
  console.log(`Thực hiện kiểm tra 20 lần để xác nhận tính ngẫu nhiên`);
  
  // Lưu thống kê
  const stats: Record<string, number> = {};
  
  // Kiểm tra nhiều lần để đánh giá tính ngẫu nhiên
  for (let i = 0; i < 20; i++) {
    const balance = await checkEthereumBalance(address);
    console.log(`Lần ${i + 1}: Balance = ${balance} ETH`);
    
    // Ghi lại thông tin slot được chọn từ log
    // Lưu ý: Thông tin slot được in ra trong hàm getNextEthereumApi 
    // nhưng không được trả về trực tiếp, nên chúng ta không theo dõi được ở đây
  }
  
  console.log('Hoàn thành test cơ chế xoay vòng ngẫu nhiên cho Ethereum');
}

// Chạy test
testEthereumRandomRotation().catch(console.error);