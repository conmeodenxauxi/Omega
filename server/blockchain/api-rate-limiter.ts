/**
 * Utility module quản lý tốc độ truy cập API
 * Giúp tránh các vấn đề rate limit và tối ưu hóa việc sử dụng API key
 */

interface ApiUsage {
  key: string;
  timestamp: number;
  count: number;
}

interface RateLimitConfig {
  limit: number;       // Số lượng request tối đa trong khoảng thời gian 
  windowMs: number;    // Khoảng thời gian tính bằng milliseconds
}

class ApiRateLimiter {
  private static instance: ApiRateLimiter;
  private usageMap: Map<string, ApiUsage[]> = new Map();
  private defaultConfig: RateLimitConfig = {
    limit: 10,         // Mặc định 10 request
    windowMs: 1000     // Trong 1 giây
  };
  private configMap: Map<string, RateLimitConfig> = new Map();

  private constructor() {
    // Thiết lập cấu hình mặc định cho các provider
    
    // Solana (Helius) - 10 request/giây cho mỗi key
    this.setConfig('SOL_Helius', {
      limit: 10,
      windowMs: 1000 // 1 giây
    });
    
    // Public Solana RPC - 5 request/giây
    this.setConfig('SOL_Solana-RPC-MainNet', {
      limit: 5,
      windowMs: 1000 // 1 giây
    });
    
    // BTC - Tatum - 5 request/giây
    this.setConfig('BTC_Tatum', {
      limit: 5,
      windowMs: 1000 // 1 giây
    });
    
    // BTC - BlockCypher - 3 request/giây  
    this.setConfig('BTC_BlockCypher', {
      limit: 3,
      windowMs: 1000 // 1 giây
    });
    
    // BTC - GetBlock - 10 request/giây
    this.setConfig('BTC_GetBlock', {
      limit: 10,
      windowMs: 1000 // 1 giây
    });
    
    // BTC - Public endpoints with lower limits
    this.setConfig('BTC_Blockchair', {
      limit: 2,
      windowMs: 1000 // 1 giây
    });
  }

  public static getInstance(): ApiRateLimiter {
    if (!ApiRateLimiter.instance) {
      ApiRateLimiter.instance = new ApiRateLimiter();
    }
    return ApiRateLimiter.instance;
  }

  /**
   * Đặt cấu hình cho một loại API cụ thể
   * @param apiType Tên loại API (BTC_Tatum, SOL_Helius, etc.)
   * @param config Cấu hình rate limit
   */
  public setConfig(apiType: string, config: RateLimitConfig): void {
    this.configMap.set(apiType, config);
  }

  /**
   * Kiểm tra nếu một API key có thể được sử dụng
   * @param apiType Loại API (BTC_Tatum, SOL_Helius, etc.)
   * @param key API key
   * @returns true nếu key có thể sử dụng, false nếu đã đạt giới hạn
   */
  public canUseKey(apiType: string, key: string): boolean {
    const apiKey = `${apiType}:${key}`;
    const config = this.configMap.get(apiType) || this.defaultConfig;
    const now = Date.now();
    
    // Lấy lịch sử sử dụng của key này
    const usages = this.usageMap.get(apiKey) || [];
    
    // Lọc ra các usage trong khoảng thời gian window
    const recentUsages = usages.filter(
      usage => now - usage.timestamp < config.windowMs
    );
    
    // Cập nhật lại lịch sử sử dụng
    this.usageMap.set(apiKey, recentUsages);
    
    // Kiểm tra xem có vượt quá giới hạn không
    return recentUsages.length < config.limit;
  }

  /**
   * Đánh dấu việc sử dụng key
   * @param apiType Loại API
   * @param key API key
   */
  public useKey(apiType: string, key: string): void {
    const apiKey = `${apiType}:${key}`;
    const now = Date.now();
    
    const usages = this.usageMap.get(apiKey) || [];
    usages.push({
      key,
      timestamp: now,
      count: 1
    });
    
    this.usageMap.set(apiKey, usages);
  }

  /**
   * Tìm key khả dụng từ danh sách
   * @param apiType Loại API
   * @param keys Danh sách key
   * @param nextIndex Vị trí bắt đầu tìm kiếm (để duy trì cơ chế xoay vòng)
   * @returns {index, key} Vị trí và key khả dụng, hoặc null nếu không tìm thấy
   */
  public findAvailableKey(
    apiType: string, 
    keys: string[], 
    nextIndex: number
  ): { index: number; key: string } | null {
    if (keys.length === 0) return null;
    
    // Kiểm tra tuần tự bắt đầu từ nextIndex
    const startIdx = nextIndex % keys.length;
    for (let i = 0; i < keys.length; i++) {
      const idx = (startIdx + i) % keys.length;
      const key = keys[idx];
      
      if (this.canUseKey(apiType, key)) {
        this.useKey(apiType, key);
        return { index: idx, key };
      }
    }
    
    // Nếu không tìm thấy key nào khả dụng, trả về null
    return null;
  }

  /**
   * Đánh dấu một API key không sử dụng được nữa (bị rate limit)
   * @param apiType Loại API
   * @param key API key
   * @param timeoutMs Thời gian chờ trước khi key có thể được sử dụng lại (ms)
   */
  public markKeyAsRateLimited(apiType: string, key: string, timeoutMs: number = 60000): void {
    const apiKey = `${apiType}:${key}`;
    const now = Date.now();
    
    // Tạo giả lập các lần sử dụng để điền đầy quota
    const config = this.configMap.get(apiType) || this.defaultConfig;
    const dummyUsages: ApiUsage[] = Array(config.limit).fill(null).map(() => ({
      key,
      timestamp: now,
      count: 1
    }));
    
    this.usageMap.set(apiKey, dummyUsages);
    
    // Tự động reset sau timeoutMs
    setTimeout(() => {
      // Xóa các giả lập usage
      this.usageMap.delete(apiKey);
    }, timeoutMs);
  }
}

// Singleton instance
export const apiRateLimiter = ApiRateLimiter.getInstance();

// Thiết lập bổ sung cấu hình cho các loại API khác
apiRateLimiter.setConfig('BTC_NowNodes', { limit: 5, windowMs: 1000 });
apiRateLimiter.setConfig('ETH_Etherscan', { limit: 5, windowMs: 1000 });
apiRateLimiter.setConfig('BSC_BSCScan', { limit: 5, windowMs: 1000 });
apiRateLimiter.setConfig('DOGE_Tatum', { limit: 5, windowMs: 1000 });
apiRateLimiter.setConfig('DOGE_NowNodes', { limit: 5, windowMs: 1000 });