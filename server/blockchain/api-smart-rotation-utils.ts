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
      if (error?.status === 429 || (error?.message && error.message.includes('rate limit'))) {
        // Tính thời gian chờ theo hàm mũ: 2^retries * 1000ms (1s, 2s, 4s...)
        const backoffTime = Math.pow(2, retries) * 1000;
        console.log(`Rate limited, backing off for ${backoffTime}ms`);
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