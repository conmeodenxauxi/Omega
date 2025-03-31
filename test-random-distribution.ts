/**
 * Script kiểm tra hiệu quả của cơ chế phân bổ ngẫu nhiên
 * Thực hiện nhiều request kiểm tra số dư đồng thời để đánh giá phân phối load
 */

import { BlockchainType } from "./shared/schema";
import { checkSolanaBalance } from "./server/blockchain/api-smart-rotation-sol";
import { checkBitcoinBalance } from "./server/blockchain/api-smart-rotation-btc";

// Số lượng request song song
const CONCURRENT_REQUESTS = 10;

// Địa chỉ ví Solana để kiểm tra
const SOLANA_TEST_ADDRESS = 'GaVNTXBCnHFGWVtCynjzAetJ6cUFQTUzwuZoxUCFEbXB';

// Địa chỉ ví Bitcoin để kiểm tra
const BITCOIN_TEST_ADDRESS = 'bc1qfhf3fwzajw7e920zy3pvs56nnwkut5uk82fy6v';

/**
 * Thực hiện nhiều request Solana song song để kiểm tra phân phối ngẫu nhiên
 */
async function testSolanaRandomDistribution() {
  console.log(`Thực hiện ${CONCURRENT_REQUESTS} request kiểm tra số dư Solana song song...`);
  
  // Mảng chứa tất cả các promises
  const promises: Promise<string>[] = [];
  
  // Tạo nhiều request song song
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    promises.push(checkSolanaBalance(SOLANA_TEST_ADDRESS));
  }
  
  // Chờ tất cả hoàn thành
  try {
    const results = await Promise.all(promises);
    console.log(`Hoàn thành ${results.length} request kiểm tra số dư Solana.`);
    console.log(`Số dư Solana: ${results[0]} SOL`);
    return true;
  } catch (error) {
    console.error('Lỗi khi kiểm tra Solana:', error);
    return false;
  }
}

/**
 * Thực hiện nhiều request Bitcoin song song để kiểm tra phân phối ngẫu nhiên
 */
async function testBitcoinRandomDistribution() {
  console.log(`Thực hiện ${CONCURRENT_REQUESTS} request kiểm tra số dư Bitcoin song song...`);
  
  // Mảng chứa tất cả các promises
  const promises: Promise<string>[] = [];
  
  // Tạo nhiều request song song
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    promises.push(checkBitcoinBalance(BITCOIN_TEST_ADDRESS));
  }
  
  // Chờ tất cả hoàn thành
  try {
    const results = await Promise.all(promises);
    console.log(`Hoàn thành ${results.length} request kiểm tra số dư Bitcoin.`);
    console.log(`Số dư Bitcoin: ${results[0]} BTC`);
    return true;
  } catch (error) {
    console.error('Lỗi khi kiểm tra Bitcoin:', error);
    return false;
  }
}

/**
 * Chạy tất cả các kiểm tra phân phối ngẫu nhiên
 */
async function runAllTests() {
  console.log('*** Bắt đầu kiểm tra phân phối ngẫu nhiên của key rotation ***');
  
  // Chỉ kiểm tra Bitcoin
  console.log('\n=== Kiểm tra phân phối ngẫu nhiên Bitcoin ===');
  await testBitcoinRandomDistribution();
  
  console.log('\n*** Hoàn thành tất cả kiểm tra ***');
}

// Chạy tất cả các test
runAllTests().catch(error => {
  console.error('Lỗi trong quá trình kiểm tra:', error);
});