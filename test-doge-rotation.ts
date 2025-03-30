/**
 * Script kiểm tra cơ chế xoay vòng thông minh cho Dogecoin
 */
import { checkDogecoinBalance } from './server/blockchain/api-smart-rotation-doge';

async function testDogecoinRotation() {
  // Địa chỉ Dogecoin nổi tiếng để kiểm tra
  const addresses = [
    'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L', // Địa chỉ Robinhood
    'D8vFz4p1L37jdg9xpPJo5PxqUKVczXxiEi', // Địa chỉ khác có số dư lớn
  ];

  console.log('===== KIỂM TRA CƠ CHẾ XOAY VÒNG THÔNG MINH CHO DOGECOIN =====');
  console.log('Tỷ lệ xoay vòng: 3 Tatum : 1 NowNodes');
  
  // Thực hiện 8 lần kiểm tra để xác nhận mô hình xoay vòng
  for (let i = 0; i < 8; i++) {
    const address = addresses[i % addresses.length];
    
    console.log(`\nKiểm tra #${i+1} - Địa chỉ: ${address}`);
    try {
      const balance = await checkDogecoinBalance(address);
      console.log(`Số dư: ${balance}`);
    } catch (error) {
      console.error('Lỗi:', error);
    }
    
    // Đợi 1 giây giữa các lần kiểm tra để tránh rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n===== KẾT LUẬN =====');
  console.log('Kiểm tra hoàn tất. Xoay vòng nên thể hiện mô hình 3:1 (Tatum:NowNodes)');
}

// Chạy kiểm tra
testDogecoinRotation().catch(console.error);