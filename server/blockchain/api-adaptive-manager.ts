/**
 * Hệ thống quản lý thích ứng cho các API blockchain
 * Bao gồm:
 * 1. Circuit Breaker Pattern - tạm blacklist API keys bị lỗi
 * 2. Hệ thống trọng số thích ứng - ưu tiên API keys hoạt động tốt
 * 3. Điều chỉnh concurrency thích ứng - tối ưu hóa song song
 */

import { BlockchainType } from '../../shared/schema';

// Cấu trúc lưu thông tin về một provider API
interface ProviderStats {
  name: string;           // Tên provider
  weight: number;         // Trọng số (0.1 - 1.0)
  blacklistedUntil: number; // Timestamp hết hạn blacklist (0 = không bị blacklist)
  successCount: number;   // Số lần thành công
  errorCount: number;     // Số lần lỗi
  ratelimitCount: number; // Số lần bị rate limit
}

// Thời gian blacklist mặc định (60 giây)
const DEFAULT_BLACKLIST_DURATION = 60 * 1000;

// Thời gian blacklist khi bị rate limit (thường dài hơn lỗi thông thường)
const RATELIMIT_BLACKLIST_DURATION = 120 * 1000;

// Hệ số giảm trọng số khi gặp lỗi
const ERROR_PENALTY_FACTOR = 0.8;

// Hệ số tăng trọng số khi thành công
const SUCCESS_REWARD_FACTOR = 1.02;

// Trọng số tối thiểu cho một provider
const MIN_WEIGHT = 0.1;

// Trọng số tối đa cho một provider
const MAX_WEIGHT = 1.0;

// Số lần lỗi liên tiếp trước khi giảm concurrency
const ERROR_THRESHOLD_FOR_CONCURRENCY = 5;

// Lưu trữ trạng thái của tất cả các providers
const providersRegistry: Record<string, Record<string, ProviderStats>> = {
  BTC: {},
  ETH: {},
  BSC: {},
  SOL: {},
  DOGE: {}
};

// Theo dõi concurrency thích ứng cho mỗi blockchain
const adaptiveConcurrency: Record<BlockchainType, { 
  current: number,    // Số lượng concurrency hiện tại
  max: number,        // Số lượng tối đa cho phép
  min: number,        // Số lượng tối thiểu
  errorStreak: number // Số lỗi liên tiếp
}> = {
  BTC: { current: 45, max: 45, min: 15, errorStreak: 0 },
  ETH: { current: 15, max: 15, min: 5, errorStreak: 0 },
  BSC: { current: 15, max: 15, min: 5, errorStreak: 0 },
  SOL: { current: 15, max: 15, min: 5, errorStreak: 0 },
  DOGE: { current: 15, max: 15, min: 5, errorStreak: 0 }
};

/**
 * Đăng ký một provider API mới vào hệ thống
 * @param blockchain Loại blockchain
 * @param name Tên của provider
 */
export function registerProvider(blockchain: BlockchainType, name: string): void {
  // Nếu provider chưa tồn tại, thêm vào với giá trị mặc định
  if (!providersRegistry[blockchain][name]) {
    providersRegistry[blockchain][name] = {
      name,
      weight: 1.0,
      blacklistedUntil: 0,
      successCount: 0,
      errorCount: 0,
      ratelimitCount: 0
    };
  }
}

/**
 * Nhận danh sách tất cả các providers đã đăng ký
 * @param blockchain Loại blockchain
 * @returns Danh sách tên providers
 */
export function getAllProviders(blockchain: BlockchainType): string[] {
  return Object.keys(providersRegistry[blockchain]);
}

/**
 * Lấy danh sách các providers hiện không bị blacklist
 * @param blockchain Loại blockchain
 * @returns Danh sách tên providers khả dụng
 */
export function getAvailableProviders(blockchain: BlockchainType): string[] {
  const now = Date.now();
  return Object.values(providersRegistry[blockchain])
    .filter(provider => provider.blacklistedUntil < now)
    .map(provider => provider.name);
}

/**
 * Cập nhật thông tin khi một provider thành công
 * @param blockchain Loại blockchain
 * @param name Tên provider
 */
export function reportSuccess(blockchain: BlockchainType, name: string): void {
  if (!providersRegistry[blockchain][name]) {
    registerProvider(blockchain, name);
  }
  
  const provider = providersRegistry[blockchain][name];
  provider.successCount += 1;
  
  // Tăng nhẹ trọng số khi thành công
  provider.weight = Math.min(MAX_WEIGHT, provider.weight * SUCCESS_REWARD_FACTOR);
  
  // Reset streak error nếu thành công
  adaptiveConcurrency[blockchain].errorStreak = 0;
  
  // Tăng dần concurrency nếu thành công nhiều
  if (provider.successCount % 10 === 0 && 
      adaptiveConcurrency[blockchain].current < adaptiveConcurrency[blockchain].max) {
    adaptiveConcurrency[blockchain].current += 1;
    console.log(`Tăng concurrency cho ${blockchain} lên ${adaptiveConcurrency[blockchain].current}`);
  }
}

/**
 * Cập nhật thông tin khi một provider gặp lỗi thông thường
 * @param blockchain Loại blockchain
 * @param name Tên provider
 */
export function reportError(blockchain: BlockchainType, name: string): void {
  if (!providersRegistry[blockchain][name]) {
    registerProvider(blockchain, name);
  }
  
  const provider = providersRegistry[blockchain][name];
  provider.errorCount += 1;
  
  // Giảm trọng số khi gặp lỗi
  provider.weight = Math.max(MIN_WEIGHT, provider.weight * ERROR_PENALTY_FACTOR);
  
  // Blacklist trong thời gian ngắn
  provider.blacklistedUntil = Date.now() + DEFAULT_BLACKLIST_DURATION;
  
  // Tăng error streak
  adaptiveConcurrency[blockchain].errorStreak += 1;
  
  // Giảm concurrency nếu nhiều lỗi liên tiếp
  if (adaptiveConcurrency[blockchain].errorStreak >= ERROR_THRESHOLD_FOR_CONCURRENCY &&
      adaptiveConcurrency[blockchain].current > adaptiveConcurrency[blockchain].min) {
    adaptiveConcurrency[blockchain].current -= 1;
    console.log(`Giảm concurrency cho ${blockchain} xuống ${adaptiveConcurrency[blockchain].current} do nhiều lỗi liên tiếp`);
    adaptiveConcurrency[blockchain].errorStreak = 0; // Reset sau khi giảm
  }
  
  console.log(`Provider ${name} cho ${blockchain} bị lỗi, đã blacklist trong ${DEFAULT_BLACKLIST_DURATION/1000}s`);
}

/**
 * Cập nhật thông tin khi một provider bị rate limit
 * @param blockchain Loại blockchain
 * @param name Tên provider
 */
export function reportRateLimit(blockchain: BlockchainType, name: string): void {
  if (!providersRegistry[blockchain][name]) {
    registerProvider(blockchain, name);
  }
  
  const provider = providersRegistry[blockchain][name];
  provider.ratelimitCount += 1;
  provider.errorCount += 1;
  
  // Giảm mạnh trọng số khi bị rate limit
  provider.weight = Math.max(MIN_WEIGHT, provider.weight * (ERROR_PENALTY_FACTOR * 0.8));
  
  // Blacklist trong thời gian dài hơn so với lỗi thông thường
  provider.blacklistedUntil = Date.now() + RATELIMIT_BLACKLIST_DURATION;
  
  // Tăng error streak
  adaptiveConcurrency[blockchain].errorStreak += 2; // Rate limit được tính nặng hơn lỗi thông thường
  
  // Giảm concurrency nếu nhiều rate limit
  if (adaptiveConcurrency[blockchain].errorStreak >= ERROR_THRESHOLD_FOR_CONCURRENCY &&
      adaptiveConcurrency[blockchain].current > adaptiveConcurrency[blockchain].min) {
    adaptiveConcurrency[blockchain].current -= 2; // Giảm nhanh hơn khi bị rate limit
    adaptiveConcurrency[blockchain].current = Math.max(
      adaptiveConcurrency[blockchain].min, 
      adaptiveConcurrency[blockchain].current
    );
    console.log(`Giảm concurrency cho ${blockchain} xuống ${adaptiveConcurrency[blockchain].current} do nhiều rate limit`);
    adaptiveConcurrency[blockchain].errorStreak = 0; // Reset sau khi giảm
  }
  
  console.log(`Provider ${name} cho ${blockchain} bị RATE LIMIT, đã blacklist trong ${RATELIMIT_BLACKLIST_DURATION/1000}s`);
}

/**
 * Lấy trọng số hiện tại của một provider
 * @param blockchain Loại blockchain
 * @param name Tên provider
 * @returns Trọng số
 */
export function getProviderWeight(blockchain: BlockchainType, name: string): number {
  if (!providersRegistry[blockchain][name]) {
    return MIN_WEIGHT;
  }
  return providersRegistry[blockchain][name].weight;
}

/**
 * Chọn một provider dựa trên thuật toán weighted random
 * @param blockchain Loại blockchain
 * @param providerNames Danh sách providers để chọn từ đó
 * @returns Tên provider được chọn
 */
export function selectWeightedProvider(blockchain: BlockchainType, providerNames: string[]): string {
  const now = Date.now();
  
  // Lọc bỏ các provider đang bị blacklist
  const availableProviders = providerNames.filter(name => {
    const provider = providersRegistry[blockchain][name];
    return !provider || provider.blacklistedUntil < now;
  });
  
  // Nếu tất cả đều bị blacklist, reset blacklist và sử dụng tất cả
  if (availableProviders.length === 0) {
    console.log(`Tất cả providers cho ${blockchain} đều bị blacklist, reset blacklist`);
    providerNames.forEach(name => {
      if (providersRegistry[blockchain][name]) {
        providersRegistry[blockchain][name].blacklistedUntil = 0;
      }
    });
    
    return selectWeightedRandom(providerNames, name => {
      return providersRegistry[blockchain][name]?.weight || MIN_WEIGHT;
    });
  }
  
  // Chọn ngẫu nhiên theo trọng số từ các provider khả dụng
  return selectWeightedRandom(availableProviders, name => {
    return providersRegistry[blockchain][name]?.weight || MIN_WEIGHT;
  });
}

/**
 * Lấy giới hạn concurrency hiện tại cho một blockchain
 * @param blockchain Loại blockchain
 * @returns Số lượng concurrency hiện tại
 */
export function getCurrentConcurrency(blockchain: BlockchainType): number {
  return adaptiveConcurrency[blockchain].current;
}

/**
 * Hàm tiện ích để chọn ngẫu nhiên có trọng số
 * @param items Danh sách các item để chọn
 * @param getWeight Hàm trả về trọng số cho một item
 * @returns Item được chọn
 */
function selectWeightedRandom<T>(items: T[], getWeight: (item: T) => number): T {
  if (items.length === 0) {
    throw new Error("Không thể chọn từ danh sách rỗng");
  }
  
  if (items.length === 1) {
    return items[0];
  }
  
  // Tính tổng trọng số
  const totalWeight = items.reduce((sum, item) => sum + getWeight(item), 0);
  
  // Chọn một điểm ngẫu nhiên trong tổng trọng số
  let random = Math.random() * totalWeight;
  
  // Tìm item tương ứng với điểm ngẫu nhiên
  for (const item of items) {
    random -= getWeight(item);
    if (random <= 0) {
      return item;
    }
  }
  
  // Phòng trường hợp làm tròn số
  return items[items.length - 1];
}

/**
 * Khởi tạo hệ thống quản lý API
 * Chạy một lần khi hệ thống khởi động để đảm bảo các cấu trúc dữ liệu được khởi tạo
 */
export function initializeApiManager(): void {
  console.log("Khởi tạo hệ thống quản lý API thích ứng...");
  
  // Đảm bảo các blockchain đều đã được khởi tạo
  const blockchains: BlockchainType[] = ["BTC", "ETH", "BSC", "SOL", "DOGE"];
  
  for (const blockchain of blockchains) {
    if (!providersRegistry[blockchain]) {
      providersRegistry[blockchain] = {};
    }
  }
  
  console.log("Hệ thống quản lý API thích ứng đã sẵn sàng.");
}

// Khởi tạo khi module được import
initializeApiManager();