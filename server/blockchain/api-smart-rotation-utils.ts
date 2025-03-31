/**
 * Các tiện ích chung cho cơ chế xoay vòng API
 */

/**
 * Hàm thử lại với thời gian chờ tăng dần giữa mỗi lần thử
 * @param fn Hàm cần thực hiện và thử lại
 * @param maxRetries Số lần thử lại tối đa
 * @param endpoint Tên API endpoint để ghi log (không bắt buộc)
 * @returns Kết quả của lần thử thành công
 */
export async function checkWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  endpoint?: string
): Promise<T> {
  // Thử lần đầu
  try {
    return await fn();
  } catch (error) {
    // Nếu không cho phép thử lại hoặc đã hết số lần thử
    if (maxRetries <= 0) {
      console.error(`All retries failed for ${endpoint}:`, error);
      throw error;
    }
    
    // Thử lại với thời gian chờ tăng dần
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Thời gian chờ tăng dần theo cấp số nhân
        const backoffDelay = Math.floor(Math.random() * 1000) + attempt * 500;
        console.log(`Rate limited, backing off for ${backoffDelay}ms (retry ${attempt}/${maxRetries})`);
        
        // Đợi trước khi thử lại
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        
        // Thử lại
        return await fn();
      } catch (retryError) {
        // Nếu là lần thử cuối cùng, ném lỗi
        if (attempt === maxRetries) {
          console.error(`All retries failed for ${endpoint}:`, retryError);
          throw new Error(`Max retries reached`);
        }
        
        // Ghi log lỗi và thử lại
        console.error(`Error on retry ${attempt}/${maxRetries} for ${endpoint}:`, retryError);
      }
    }
    
    // Nếu tất cả các lần thử đều thất bại (không bao giờ đến đây do có throw ở trên)
    throw new Error(`All retries failed for ${endpoint}`);
  }
}

/**
 * Tạo promise với timeout
 * @param ms Thời gian timeout tính bằng mili giây
 * @returns Promise sẽ reject sau thời gian timeout
 */
export function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
}