/**
 * Quản lý ratelimit cho các API key
 * Tạm dừng API key bị giới hạn trong 1 phút
 */

// Thời gian tạm ngưng API key bị giới hạn (theo mili giây)
const COOLDOWN_PERIOD = 60 * 1000; // 1 phút

// Lưu trữ thông tin về các API keys đang bị rate limit
interface RateLimitedKey {
  provider: string;    // Tên nhà cung cấp API 
  keyIdentifier: string; // Định danh của key (có thể là toàn bộ key hoặc 8 ký tự đầu tiên)
  blockchain: string;  // Loại blockchain
  blockedUntil: number; // Thời điểm key có thể được sử dụng lại (timestamp)
}

// Mảng lưu trữ các API key đang bị khóa do rate limit
const rateLimitedKeys: RateLimitedKey[] = [];

/**
 * Đánh dấu một API key bị giới hạn
 * @param blockchain Loại blockchain (BTC, ETH, BSC, SOL, DOGE)
 * @param provider Tên nhà cung cấp API
 * @param keyIdentifier Định danh của key (có thể là toàn bộ key hoặc 8 ký tự đầu)
 */
export function markKeyAsRateLimited(blockchain: string, provider: string, keyIdentifier: string): void {
  // Thời điểm key sẽ được mở khóa
  const blockedUntil = Date.now() + COOLDOWN_PERIOD;
  
  // Xóa bỏ key cũ nếu đã có trong danh sách (để cập nhật thời gian)
  const existingIndex = rateLimitedKeys.findIndex(
    item => item.blockchain === blockchain && 
            item.provider === provider && 
            item.keyIdentifier === keyIdentifier
  );
  
  if (existingIndex >= 0) {
    rateLimitedKeys.splice(existingIndex, 1);
  }
  
  // Thêm key mới vào danh sách với thời gian khóa mới
  rateLimitedKeys.push({
    blockchain,
    provider,
    keyIdentifier,
    blockedUntil
  });
  
  console.log(`API key ${keyIdentifier} của ${provider} cho ${blockchain} bị rate limit. Tạm dừng trong 1 phút.`);
  
  // Dọn dẹp danh sách các key đã hết thời gian bị khóa
  cleanupExpiredKeys();
}

/**
 * Kiểm tra xem một API key có đang bị giới hạn không
 * @param blockchain Loại blockchain (BTC, ETH, BSC, SOL, DOGE)
 * @param provider Tên nhà cung cấp API
 * @param keyIdentifier Định danh của key
 * @returns true nếu key bị giới hạn, false nếu key khả dụng
 */
export function isKeyRateLimited(blockchain: string, provider: string, keyIdentifier: string): boolean {
  // Dọn dẹp danh sách các key đã hết thời gian bị khóa
  cleanupExpiredKeys();
  
  // Kiểm tra xem key có trong danh sách bị khóa không
  const isLimited = rateLimitedKeys.some(
    item => item.blockchain === blockchain && 
            item.provider === provider && 
            item.keyIdentifier === keyIdentifier &&
            item.blockedUntil > Date.now()
  );
  
  return isLimited;
}

/**
 * Kiểm tra xem một nhà cung cấp API có đang bị giới hạn không
 * @param blockchain Loại blockchain (BTC, ETH, BSC, SOL, DOGE)
 * @param provider Tên nhà cung cấp API
 * @returns true nếu provider bị giới hạn, false nếu provider khả dụng
 */
export function isProviderRateLimited(blockchain: string, provider: string): boolean {
  // Dọn dẹp danh sách các key đã hết thời gian bị khóa
  cleanupExpiredKeys();
  
  // Kiểm tra xem provider có trong danh sách bị khóa không
  const isLimited = rateLimitedKeys.some(
    item => item.blockchain === blockchain && 
            item.provider === provider &&
            item.blockedUntil > Date.now()
  );
  
  return isLimited;
}

/**
 * Lấy thời gian chờ còn lại cho một API key bị giới hạn
 * @param blockchain Loại blockchain (BTC, ETH, BSC, SOL, DOGE)
 * @param provider Tên nhà cung cấp API
 * @param keyIdentifier Định danh của key
 * @returns Thời gian chờ còn lại tính bằng mili giây, 0 nếu key không bị giới hạn
 */
export function getRemainingCooldown(blockchain: string, provider: string, keyIdentifier: string): number {
  // Tìm key trong danh sách
  const limitedKey = rateLimitedKeys.find(
    item => item.blockchain === blockchain && 
            item.provider === provider && 
            item.keyIdentifier === keyIdentifier
  );
  
  if (!limitedKey) {
    return 0;
  }
  
  // Tính thời gian còn lại
  const remainingTime = limitedKey.blockedUntil - Date.now();
  return Math.max(0, remainingTime);
}

/**
 * Lấy số lượng API key đang bị giới hạn cho một blockchain
 * @param blockchain Loại blockchain (BTC, ETH, BSC, SOL, DOGE)
 * @returns Số lượng API key đang bị giới hạn
 */
export function getRateLimitedKeyCount(blockchain: string): number {
  cleanupExpiredKeys();
  return rateLimitedKeys.filter(item => item.blockchain === blockchain).length;
}

/**
 * Xóa bỏ các key đã hết thời gian bị khóa khỏi danh sách
 */
function cleanupExpiredKeys(): void {
  const currentTime = Date.now();
  const initialLength = rateLimitedKeys.length;
  
  // Lọc ra các key còn trong thời gian bị khóa
  const activeKeys = rateLimitedKeys.filter(key => key.blockedUntil > currentTime);
  
  // Cập nhật lại danh sách
  rateLimitedKeys.length = 0;
  rateLimitedKeys.push(...activeKeys);
  
  // Thông báo về số lượng key đã được xóa
  const removedCount = initialLength - rateLimitedKeys.length;
  if (removedCount > 0) {
    console.log(`Đã xóa ${removedCount} API keys hết thời gian bị giới hạn khỏi danh sách.`);
  }
}

/**
 * Xóa tất cả các API key bị giới hạn khỏi danh sách
 */
export function clearAllRateLimits(): void {
  const count = rateLimitedKeys.length;
  rateLimitedKeys.length = 0;
  console.log(`Đã xóa ${count} API keys khỏi danh sách bị giới hạn.`);
}

/**
 * Đánh dấu một endpoint public bị giới hạn
 * @param blockchain Loại blockchain (BTC, ETH, BSC, SOL, DOGE)
 * @param endpointName Tên endpoint
 */
export function markEndpointAsRateLimited(blockchain: string, endpointName: string): void {
  markKeyAsRateLimited(blockchain, endpointName, 'public');
}

/**
 * Kiểm tra xem một endpoint public có đang bị giới hạn không
 * @param blockchain Loại blockchain (BTC, ETH, BSC, SOL, DOGE)
 * @param endpointName Tên endpoint
 * @returns true nếu endpoint bị giới hạn, false nếu endpoint khả dụng
 */
export function isEndpointRateLimited(blockchain: string, endpointName: string): boolean {
  return isKeyRateLimited(blockchain, endpointName, 'public');
}