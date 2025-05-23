/**
 * Script kiểm tra cơ chế xoay vòng ngẫu nhiên cho Solana
 * Xoay vòng ngẫu nhiên qua tất cả các slots (1 public + 22 Helius API keys)
 */

import { checkSolanaBalance } from './server/blockchain/api-smart-rotation-sol';

/**
 * Kiểm tra cơ chế xoay vòng ngẫu nhiên của Solana
 */
async function testSolanaRandomRotation() {
  console.log('Bắt đầu test cơ chế xoay vòng ngẫu nhiên cho Solana...');
  
  // Địa chỉ Solana để kiểm tra (ví Solana nổi tiếng của Binance)
  const address = '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E';
  
  console.log(`Thực hiện kiểm tra 20 lần để xác nhận tính ngẫu nhiên`);
  
  // Lưu thống kê
  const stats: Record<string, number> = {};
  
  // Kiểm tra nhiều lần để đánh giá tính ngẫu nhiên
  for (let i = 0; i < 20; i++) {
    const balance = await checkSolanaBalance(address);
    console.log(`Lần ${i + 1}: Balance = ${balance} SOL`);
    
    // Ghi lại thông tin slot được chọn từ log
    // Lưu ý: Thông tin slot được in ra trong hàm getNextSolanaApi 
    // nhưng không được trả về trực tiếp, nên chúng ta không theo dõi được ở đây
  }
  
  console.log('Hoàn thành test cơ chế xoay vòng ngẫu nhiên cho Solana');
}

// Chạy test
testSolanaRandomRotation().catch(console.error);