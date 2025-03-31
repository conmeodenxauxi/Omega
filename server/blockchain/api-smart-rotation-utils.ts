/**
 * Các tiện ích và hàm dùng chung cho cơ chế xoay vòng API thông minh
 */

/**
 * Thêm cơ chế exponential backoff khi gặp lỗi từ API
 * @param apiCall Hàm cần thực hiện
 * @param apiName Tên của API đang gọi (dùng cho log)
 * @param maxRetries Số lần thử lại tối đa
 * @param baseDelay Thời gian chờ cơ bản (ms)
 * @returns Kết quả từ apiCall hoặc lỗi nếu đã vượt quá số lần thử lại
 */
export async function checkWithBackoff<T>(
  apiCall: () => Promise<T>, 
  apiName: string = 'API', 
  maxRetries: number = 3,
  baseDelay: number = 1500
): Promise<T> {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await apiCall();
    } catch (error: any) {
      if (error?.status === 429 || error?.status === 430 || 
          (error?.message && (
            error.message.includes('rate limit') || 
            error.message.includes('limit exceeded')
          ))
      ) {
        // Tính thời gian chờ theo hàm mũ: 2^retries * baseDelay
        let backoffTime = Math.pow(2, retries) * baseDelay;
        
        // Thêm jitter (±20%) để tránh các phiên thử lại đồng thời
        const jitter = backoffTime * 0.2 * (Math.random() * 2 - 1);
        backoffTime = Math.floor(backoffTime + jitter);
        
        console.log(`Rate limited on ${apiName}, backing off for ${backoffTime}ms (retry ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        retries++;
      } else {
        console.error(`Error fetching from ${apiName}:`, error);
        if (retries < maxRetries - 1) {
          // Nếu không phải rate limit nhưng vẫn còn cơ hội retry
          retries++;
          const backoffTime = Math.pow(1.5, retries) * baseDelay;
          console.log(`Error from ${apiName}, retrying in ${backoffTime}ms (retry ${retries}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        } else {
          throw error;
        }
      }
    }
  }
  throw new Error(`Max retries (${maxRetries}) reached for ${apiName}`);
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