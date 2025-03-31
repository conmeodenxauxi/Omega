/**
 * Script kiểm tra hệ thống quản lý rate limit
 */

import { apiRateLimiter } from "./server/blockchain/api-rate-limiter";

/**
 * Kiểm tra cơ chế rate limit cơ bản
 */
async function testBasicRateLimit() {
  console.log('------- Test cơ chế rate limit cơ bản -------');
  
  // Tạo một API Type mới cho test
  apiRateLimiter.setConfig('TEST_API', { limit: 3, windowMs: 1000 });
  
  const apiKey = 'test-key-123';
  
  // Kiểm tra sử dụng key vài lần
  console.log('Lần 1:', apiRateLimiter.canUseKey('TEST_API', apiKey));
  apiRateLimiter.useKey('TEST_API', apiKey);
  
  console.log('Lần 2:', apiRateLimiter.canUseKey('TEST_API', apiKey));
  apiRateLimiter.useKey('TEST_API', apiKey);
  
  console.log('Lần 3:', apiRateLimiter.canUseKey('TEST_API', apiKey));
  apiRateLimiter.useKey('TEST_API', apiKey);
  
  // Lần thứ 4 nên trả về false vì đã đạt giới hạn 3 request/giây
  console.log('Lần 4 (nên trả về false):', apiRateLimiter.canUseKey('TEST_API', apiKey));
  
  // Chờ 1.1 giây để window trôi qua
  console.log('Đợi 1.1 giây...');
  await new Promise(resolve => setTimeout(resolve, 1100));
  
  // Giờ nên trả về true vì đã hết thời gian window
  console.log('Sau khi đợi (nên trả về true):', apiRateLimiter.canUseKey('TEST_API', apiKey));
}

/**
 * Kiểm tra cơ chế tìm key khả dụng
 */
async function testFindAvailableKey() {
  console.log('\n------- Test tìm key khả dụng -------');
  
  apiRateLimiter.setConfig('TEST_FIND', { limit: 2, windowMs: 1000 });
  
  const keys = ['key1', 'key2', 'key3', 'key4'];
  
  // Lần đầu nên trả về key1
  const result1 = apiRateLimiter.findAvailableKey('TEST_FIND', keys, 0);
  console.log('Lần 1 (nên trả về key1):', result1);
  
  // Lần 2 nên trả về key2
  const result2 = apiRateLimiter.findAvailableKey('TEST_FIND', keys, 0);
  console.log('Lần 2 (nên trả về key2):', result2);
  
  // Giả lập đánh dấu key1, key2 đã dùng hết
  apiRateLimiter.useKey('TEST_FIND', 'key1');
  apiRateLimiter.useKey('TEST_FIND', 'key2');
  apiRateLimiter.useKey('TEST_FIND', 'key1');
  apiRateLimiter.useKey('TEST_FIND', 'key2');
  
  // Lần 3 nên trả về key3 vì key1, key2 đã dùng hết
  const result3 = apiRateLimiter.findAvailableKey('TEST_FIND', keys, 0);
  console.log('Lần 3 (nên trả về key3):', result3);
}

/**
 * Kiểm tra marking key as rate limited
 */
async function testMarkAsRateLimited() {
  console.log('\n------- Test marking as rate limited -------');
  
  apiRateLimiter.setConfig('TEST_MARK', { limit: 5, windowMs: 1000 });
  
  const apiKey = 'test-key-456';
  
  console.log('Trước khi mark:', apiRateLimiter.canUseKey('TEST_MARK', apiKey));
  
  // Đánh dấu key là bị rate limit trong 2 giây
  console.log('Đánh dấu key bị rate limit trong 2 giây...');
  apiRateLimiter.markKeyAsRateLimited('TEST_MARK', apiKey, 2000);
  
  console.log('Sau khi mark (nên trả về false):', apiRateLimiter.canUseKey('TEST_MARK', apiKey));
  
  // Chờ 2.1 giây
  console.log('Đợi 2.1 giây...');
  await new Promise(resolve => setTimeout(resolve, 2100));
  
  // Giờ nên trả về true vì đã hết thời gian rate limit
  console.log('Sau khi đợi (nên trả về true):', apiRateLimiter.canUseKey('TEST_MARK', apiKey));
}

/**
 * Chạy tất cả các kiểm tra
 */
async function runAllTests() {
  console.log('===== Kiểm tra hệ thống quản lý rate limit =====');
  
  await testBasicRateLimit();
  await testFindAvailableKey();
  await testMarkAsRateLimited();
  
  console.log('\nTất cả các kiểm tra đã hoàn tất!');
}

// Chạy các kiểm tra
runAllTests().catch(console.error);