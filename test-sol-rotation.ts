/**
 * Script kiểm tra cơ chế xoay vòng thông minh cho Solana
 * Xoay vòng qua tất cả 21 slots (1 public + 20 Helius API keys)
 */

import { checkSolanaBalance } from './server/blockchain/api-smart-rotation-sol';

/**
 * Kiểm tra cơ chế xoay vòng Solana
 */
async function testSolanaRotation() {
  console.log('Bắt đầu test cơ chế xoay vòng Solana...');
  
  // Địa chỉ Solana để kiểm tra (Solana Treasury)
  const address = 'DYw8jMTrZqRYeQHKMXgwFtKD5JK9xutTGWW8nSAXAhUw';
  
  console.log(`Thực hiện kiểm tra 25 lần để xác nhận tất cả 21 slots đều hoạt động`);
  
  // Kiểm tra nhiều lần để xoay qua toàn bộ slots
  for (let i = 0; i < 25; i++) {
    const balance = await checkSolanaBalance(address);
    console.log(`Lần ${i + 1}: Balance = ${balance} SOL`);
  }
  
  console.log('Hoàn thành test Solana');
}

// Chạy test
testSolanaRotation().catch(console.error);