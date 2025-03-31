/**
 * Script kiểm tra hệ thống quản lý API thích ứng
 * Kiểm tra các chức năng chính: circuit breaker, trọng số thích ứng, và giới hạn concurrency
 */

import { 
  registerProvider, 
  reportSuccess, 
  reportError, 
  reportRateLimit, 
  getProviderWeight,
  selectWeightedProvider,
  getCurrentConcurrency,
  getAvailableProviders,
  getAllProviders
} from './server/blockchain/api-adaptive-manager';
import { BlockchainType } from '@shared/schema';

/**
 * Kiểm tra đăng ký và lấy danh sách provider
 */
function testProviderRegistration() {
  console.log('\n--- Kiểm tra đăng ký provider ---');
  
  // Đăng ký các test providers
  const blockchain: BlockchainType = 'BTC';
  registerProvider(blockchain, 'TestProvider1');
  registerProvider(blockchain, 'TestProvider2');
  registerProvider(blockchain, 'TestProvider3');
  
  // Lấy danh sách đã đăng ký
  const allProviders = getAllProviders(blockchain);
  console.log(`Tất cả providers đã đăng ký: ${allProviders.join(', ')}`);
  
  // Kiểm tra
  if (allProviders.includes('TestProvider1') && 
      allProviders.includes('TestProvider2') && 
      allProviders.includes('TestProvider3')) {
    console.log('✅ Đăng ký provider thành công!');
  } else {
    console.log('❌ Lỗi đăng ký provider!');
  }
}

/**
 * Kiểm tra cơ chế Circuit Breaker
 */
function testCircuitBreaker() {
  console.log('\n--- Kiểm tra cơ chế Circuit Breaker ---');
  
  const blockchain: BlockchainType = 'ETH';
  registerProvider(blockchain, 'CircuitTest1');
  registerProvider(blockchain, 'CircuitTest2');
  
  // Lấy danh sách trước khi blacklist
  const beforeBlacklist = getAvailableProviders(blockchain);
  console.log(`Providers khả dụng trước blacklist: ${beforeBlacklist.join(', ')}`);
  
  // Báo cáo lỗi rate limit
  console.log('Báo cáo rate limit cho CircuitTest1...');
  reportRateLimit(blockchain, 'CircuitTest1');
  
  // Lấy danh sách sau khi blacklist
  const afterBlacklist = getAvailableProviders(blockchain);
  console.log(`Providers khả dụng sau blacklist: ${afterBlacklist.join(', ')}`);
  
  // Kiểm tra
  if (!afterBlacklist.includes('CircuitTest1') && beforeBlacklist.includes('CircuitTest1')) {
    console.log('✅ Circuit Breaker hoạt động đúng - provider bị blacklist!');
  } else {
    console.log('❌ Lỗi trong cơ chế Circuit Breaker!');
  }
  
  console.log('Đợi 3 giây để quan sát kết quả blacklist...');
}

/**
 * Kiểm tra cơ chế trọng số thích ứng
 */
async function testAdaptiveWeighting() {
  console.log('\n--- Kiểm tra trọng số thích ứng ---');
  
  const blockchain: BlockchainType = 'SOL';
  
  // Đăng ký providers mới
  registerProvider(blockchain, 'WeightTest1');
  registerProvider(blockchain, 'WeightTest2');
  registerProvider(blockchain, 'WeightTest3');
  
  // Lấy trọng số ban đầu
  const initialWeight1 = getProviderWeight(blockchain, 'WeightTest1');
  const initialWeight2 = getProviderWeight(blockchain, 'WeightTest2');
  const initialWeight3 = getProviderWeight(blockchain, 'WeightTest3');
  
  console.log(`Trọng số ban đầu: WeightTest1=${initialWeight1}, WeightTest2=${initialWeight2}, WeightTest3=${initialWeight3}`);
  
  // Báo cáo thành công cho WeightTest1 (nhiều lần)
  for (let i = 0; i < 5; i++) {
    reportSuccess(blockchain, 'WeightTest1');
  }
  
  // Báo cáo lỗi cho WeightTest2 (một vài lần)
  for (let i = 0; i < 3; i++) {
    reportError(blockchain, 'WeightTest2');
  }
  
  // Lấy trọng số sau báo cáo
  const afterWeight1 = getProviderWeight(blockchain, 'WeightTest1');
  const afterWeight2 = getProviderWeight(blockchain, 'WeightTest2');
  const afterWeight3 = getProviderWeight(blockchain, 'WeightTest3');
  
  console.log(`Trọng số sau báo cáo: WeightTest1=${afterWeight1}, WeightTest2=${afterWeight2}, WeightTest3=${afterWeight3}`);
  
  // Kiểm tra
  if (afterWeight1 > initialWeight1 && afterWeight2 < initialWeight2) {
    console.log('✅ Cơ chế trọng số thích ứng hoạt động đúng!');
  } else {
    console.log('❌ Lỗi trong cơ chế trọng số thích ứng!');
  }
  
  // Kiểm tra weighted selection
  console.log('Thực hiện 10 lựa chọn dựa trên trọng số:');
  const selections: Record<string, number> = {
    'WeightTest1': 0,
    'WeightTest2': 0,
    'WeightTest3': 0
  };
  
  for (let i = 0; i < 10; i++) {
    const selected = selectWeightedProvider(blockchain, ['WeightTest1', 'WeightTest2', 'WeightTest3']);
    selections[selected]++;
    console.log(`Lựa chọn ${i+1}: ${selected}`);
  }
  
  console.log(`Kết quả phân bổ: WeightTest1=${selections['WeightTest1']}, WeightTest2=${selections['WeightTest2']}, WeightTest3=${selections['WeightTest3']}`);
  
  // WeightTest1 phải được chọn nhiều nhất vì có trọng số cao nhất
  if (selections['WeightTest1'] > selections['WeightTest2']) {
    console.log('✅ Lựa chọn có trọng số hoạt động đúng!');
  } else {
    console.log('❌ Lỗi trong cơ chế lựa chọn có trọng số!');
  }
}

/**
 * Kiểm tra cơ chế tự điều chỉnh concurrency
 */
function testAdaptiveConcurrency() {
  console.log('\n--- Kiểm tra điều chỉnh concurrency thích ứng ---');
  
  const blockchain: BlockchainType = 'BSC';
  registerProvider(blockchain, 'ConcurrencyTest');
  
  // Lấy giới hạn concurrency ban đầu
  const initialConcurrency = getCurrentConcurrency(blockchain);
  console.log(`Giới hạn concurrency ban đầu cho ${blockchain}: ${initialConcurrency}`);
  
  // Báo cáo nhiều lỗi để giảm concurrency
  for (let i = 0; i < 10; i++) {
    reportError(blockchain, 'ConcurrencyTest');
  }
  
  // Lấy giới hạn sau khi báo cáo lỗi
  const afterErrorConcurrency = getCurrentConcurrency(blockchain);
  console.log(`Giới hạn concurrency sau khi báo cáo lỗi: ${afterErrorConcurrency}`);
  
  // Báo cáo nhiều thành công để tăng concurrency
  for (let i = 0; i < 20; i++) {
    reportSuccess(blockchain, 'ConcurrencyTest');
  }
  
  // Lấy giới hạn sau khi báo cáo thành công
  const afterSuccessConcurrency = getCurrentConcurrency(blockchain);
  console.log(`Giới hạn concurrency sau khi báo cáo thành công: ${afterSuccessConcurrency}`);
  
  // Kiểm tra
  if (afterErrorConcurrency <= initialConcurrency && afterSuccessConcurrency >= afterErrorConcurrency) {
    console.log('✅ Cơ chế điều chỉnh concurrency thích ứng hoạt động đúng!');
  } else {
    console.log('❌ Lỗi trong cơ chế điều chỉnh concurrency thích ứng!');
  }
}

/**
 * Hàm chính để chạy tất cả các kiểm tra
 */
async function runAllTests() {
  console.log('=== Bắt đầu kiểm tra hệ thống quản lý API thích ứng ===');
  
  // Chạy các kiểm tra
  testProviderRegistration();
  testCircuitBreaker();
  
  // Đợi 3 giây để có thể quan sát kết quả blacklist
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await testAdaptiveWeighting();
  testAdaptiveConcurrency();
  
  console.log('\n=== Kết thúc kiểm tra hệ thống quản lý API thích ứng ===');
}

// Chạy tất cả các kiểm tra
runAllTests().catch(console.error);