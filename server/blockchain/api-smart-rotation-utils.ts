/**
 * Các tiện ích và hàm dùng chung cho cơ chế xoay vòng API thông minh
 */

/**
 * Thêm cơ chế exponential backoff khi gặp rate limit
 * @param apiCall Hàm cần thực hiện
 * @param maxRetries Số lần thử lại tối đa
 * @returns Kết quả từ apiCall hoặc lỗi nếu đã vượt quá số lần thử lại
 */
export async function checkWithBackoff<T>(apiCall: () => Promise<T>, maxRetries = 3): Promise<T> {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await apiCall();
    } catch (error: any) {
      if (error?.status === 429 || error?.status === 430 || (error?.message && (error.message.includes('rate limit') || error.message.includes('limit exceeded')))) {
        // Tính thời gian chờ theo hàm mũ: 2^retries * 1500ms (1.5s, 3s, 6s...)
        // Tăng base từ 1000ms lên 1500ms khi chạy nhiều phiên đồng thời
        const baseTime = 1500;
        let backoffTime = Math.pow(2, retries) * baseTime;
        
        // Thêm jitter (±20%) để tránh các phiên thử lại đồng thời
        const jitter = backoffTime * 0.2 * (Math.random() * 2 - 1);
        backoffTime = Math.floor(backoffTime + jitter);
        
        console.log(`Rate limited, backing off for ${backoffTime}ms (retry ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        retries++;
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries reached");
}

/**
 * Tạo một promise với timeout
 * @param ms Thời gian timeout (ms)
 * @returns Promise sẽ reject sau thời gian chỉ định
 */
export const timeoutPromise = (ms: number) => {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timed out')), ms);
  });
};