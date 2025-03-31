/**
 * Cơ chế xoay vòng thông minh dành riêng cho Bitcoin
 * Xoay vòng qua tất cả các endpoint và API key có sẵn, mỗi lần chỉ gọi 1 request
 */

import { BlockchainType } from "@shared/schema";
import fetch, { RequestInit } from "node-fetch";
import { getApiKey, blockchainEndpoints } from "./api-keys";
import { checkWithBackoff } from "./api-smart-rotation-utils";
import { apiRateLimiter } from "./api-rate-limiter";

// Index hiện tại trong vòng xoay BTC
let btcRotationIndex = 0;

// Tổng số slot trong vòng xoay BTC
let totalBtcSlots = 0;

// Cache cho quá trình tính toán slot
let btcSlotsCalculated = false;

// Số lần thử lại tối đa khi không tìm thấy key khả dụng
const MAX_RETRY_FINDING_KEY = 3;

/**
 * Tính toán tổng số slot cho vòng xoay BTC
 * RPC public không cần key được tính là 1 slot
 * Mỗi API key riêng cũng được tính là 1 slot
 */
function calculateTotalBtcSlots(): number {
  if (btcSlotsCalculated && totalBtcSlots > 0) {
    return totalBtcSlots;
  }

  let slots = 0;
  
  // Lấy tất cả endpoint có sẵn cho BTC
  const endpoints = blockchainEndpoints['BTC'];
  
  for (const endpoint of endpoints) {
    if (!endpoint.needsApiKey) {
      // Endpoint không cần API key (RPC public) - tính là 1 slot
      // Giảm số slot của BlockCypher Public và Blockchair do thường xuyên bị rate limit
      if (endpoint.name === 'BlockCypher Public' || endpoint.name === 'Blockchair') {
        slots += 0.5; // Giảm xuống 0.5 slot (giảm tần suất sử dụng)
      } else {
        slots += 1;
      }
    } else {
      // Endpoint cần API key
      switch (endpoint.name) {
        case 'BlockCypher':
          // Lấy số lượng key từ provider BTC_BLOCKCYPHER
          try {
            const testKey = getApiKey('BTC', 'BlockCypher');
            if (testKey) {
              // Giảm số slot BlockCypher do hay bị rate limit
              slots += endpoint.name === 'BlockCypher' ? 1 : 0; // Giảm từ 3 xuống 1 slot để tránh quá tải
            }
          } catch (error) {
            console.log(`Không có API key nào cho ${endpoint.name}`);
          }
          break;
        case 'GetBlock':
          // Lấy số lượng key từ provider BTC_GETBLOCK - ổn định nên giữ nguyên slots
          try {
            const testKey = getApiKey('BTC', 'GetBlock');
            if (testKey) {
              slots += endpoint.name === 'GetBlock' ? 17 : 0; // giữ nguyên số thực tế từ api-keys.ts
            }
          } catch (error) {
            console.log(`Không có API key nào cho ${endpoint.name}`);
          }
          break;
        case 'BTC_Tatum':
          // Lấy số lượng key từ provider BTC_TATUM
          try {
            const testKey = getApiKey('BTC', 'BTC_Tatum');
            if (testKey) {
              slots += endpoint.name === 'BTC_Tatum' ? 15 : 0; // Tăng lên 15 slot để đảm bảo mỗi API key có 1 slot
            }
          } catch (error) {
            console.log(`Không có API key nào cho ${endpoint.name}`);
          }
          break;
        default:
          // Endpoint không rõ, tính là 1 slot
          slots += 1;
      }
    }
  }
  
  totalBtcSlots = slots;
  btcSlotsCalculated = true;
  console.log(`Tổng số slot trong vòng xoay BTC: ${totalBtcSlots}`);
  
  return totalBtcSlots;
}

/**
 * Lấy cấu hình API tiếp theo cho Bitcoin theo vòng xoay với cơ chế rate limit
 * Đảm bảo mỗi request chỉ gọi 1 API duy nhất và tránh các key đang bị rate limit
 */
function getNextBitcoinApi(address: string, retryCount: number = 0): {
  name: string;
  url: string;
  headers: Record<string, string>;
  method: string;
  body?: string;
} {
  // Kiểm tra số lần thử lại để tránh vòng lặp vô hạn
  if (retryCount >= MAX_RETRY_FINDING_KEY) {
    console.warn(`[BTC Rotation] Đã thử ${retryCount} lần không tìm thấy API khả dụng, sử dụng API đầu tiên`);
    // Trả về API đầu tiên nếu không tìm thấy API nào khả dụng sau nhiều lần thử
    const fallbackEndpoint = blockchainEndpoints['BTC'][0];
    const fallbackUrl = fallbackEndpoint.formatUrl 
      ? fallbackEndpoint.formatUrl(address) 
      : fallbackEndpoint.url;
    
    return {
      name: fallbackEndpoint.name,
      url: fallbackUrl,
      headers: fallbackEndpoint.headers || { 'Content-Type': 'application/json' },
      method: fallbackEndpoint.method || 'GET',
      body: fallbackEndpoint.formatBody ? JSON.stringify(fallbackEndpoint.formatBody(address)) : undefined
    };
  }

  // Đảm bảo đã tính toán tổng số slot
  const totalSlots = calculateTotalBtcSlots();
  
  // Xoay đến vị trí tiếp theo
  btcRotationIndex = (btcRotationIndex + 1) % totalSlots;
  console.log(`BTC rotation slot: ${btcRotationIndex + 1}/${totalSlots}`);
  
  // Lấy endpoint và API key phù hợp với vị trí hiện tại
  const endpoints = blockchainEndpoints['BTC'];
  
  // Đếm slot đã đi qua
  let passedSlots = 0;
  
  for (const endpoint of endpoints) {
    if (!endpoint.needsApiKey) {
      // Endpoint không cần API key (public endpoint)
      passedSlots += 1;
      
      if (passedSlots > btcRotationIndex) {
        // Kiểm tra nếu endpoint public này đang bị rate limit
        const apiType = `BTC_${endpoint.name.replace(/\s+/g, '')}`;
        if (!apiRateLimiter.canUseKey(apiType, 'public')) {
          console.log(`[BTC Rotation] API ${endpoint.name} đang bị rate limit, thử API khác`);
          return getNextBitcoinApi(address, retryCount + 1);
        }
        
        // Đã đến vị trí cần lấy và endpoint này có thể sử dụng
        const url = endpoint.formatUrl ? endpoint.formatUrl(address) : endpoint.url;
        const headers = endpoint.headers || { 'Content-Type': 'application/json' };
        const method = endpoint.method || 'GET';
        const body = endpoint.formatBody ? JSON.stringify(endpoint.formatBody(address)) : undefined;
        
        endpoint.callCount++;
        // Đánh dấu API này đã được sử dụng
        apiRateLimiter.useKey(apiType, 'public');
        
        console.log(`[BTC Rotation] Đã chọn ${endpoint.name} (public) - Slot ${btcRotationIndex + 1}/${totalSlots}`);
        
        return {
          name: endpoint.name,
          url,
          headers,
          method,
          body
        };
      }
    } else {
      // Endpoint cần API key - tính số slot dựa vào số lượng key
      let keyCount = 0;
      let apiType = '';
      
      switch (endpoint.name) {
        case 'BlockCypher':
          keyCount = 3; // Giảm từ 9 xuống 3 slot để tránh quá tải
          apiType = 'BTC_BlockCypher';
          break;
        case 'GetBlock':
          keyCount = 17; // Tổng số key thực tế từ api-keys.ts
          apiType = 'BTC_GetBlock';
          break;
        case 'BTC_Tatum':
          keyCount = 15; // Tổng số key thực tế từ api-keys.ts
          apiType = 'BTC_Tatum';
          break;
        default:
          keyCount = 1;
          apiType = `BTC_${endpoint.name}`;
      }
      
      // Kiểm tra xem slot hiện tại có thuộc về endpoint này không
      if (btcRotationIndex >= passedSlots && btcRotationIndex < passedSlots + keyCount) {
        // Tính chỉ số key cần dùng
        const keyIndex = btcRotationIndex - passedSlots;
        
        // Lấy API key theo vị trí cụ thể
        let apiKey = '';
        
        try {
          switch (endpoint.name) {
            case 'BlockCypher':
              apiKey = getApiKey('BTC', 'BlockCypher');
              break;
            case 'GetBlock':
              apiKey = getApiKey('BTC', 'GetBlock');
              break;
            case 'BTC_Tatum':
              apiKey = getApiKey('BTC', 'BTC_Tatum');
              break;
            default:
              apiKey = getApiKey('BTC', endpoint.name);
          }
          
          // Kiểm tra nếu key này đang bị rate limit
          if (!apiRateLimiter.canUseKey(apiType, apiKey)) {
            console.log(`[BTC Rotation] API key ${apiKey.substring(0, 8)}... đang bị rate limit, thử API khác`);
            return getNextBitcoinApi(address, retryCount + 1);
          }
          
        } catch (error) {
          console.error(`Error getting API key for ${endpoint.name}:`, error);
          // Xoay vòng lại nếu không lấy được key
          return getNextBitcoinApi(address, retryCount + 1);
        }
        
        // Chuẩn bị URL và headers
        const url = endpoint.formatUrl 
          ? endpoint.formatUrl(address, apiKey) 
          : endpoint.url;
        
        const headers = endpoint.formatHeaders 
          ? endpoint.formatHeaders(apiKey) 
          : (endpoint.headers || { 'Content-Type': 'application/json' });
        
        const body = endpoint.formatBody 
          ? JSON.stringify(endpoint.formatBody(address, apiKey)) 
          : undefined;
        
        endpoint.callCount++;
        // Đánh dấu API key này đã được sử dụng
        apiRateLimiter.useKey(apiType, apiKey);
        
        console.log(`[BTC Rotation] Đã chọn ${endpoint.name} với API key ${apiKey.substring(0, 8)}... - Slot ${btcRotationIndex + 1}/${totalSlots}`);
        
        return {
          name: endpoint.name,
          url,
          headers,
          method: endpoint.method || 'GET',
          body
        };
      }
      
      // Cập nhật số slot đã đi qua
      passedSlots += keyCount;
    }
  }
  
  // Nếu không tìm thấy cấu hình phù hợp (không nên xảy ra), reset về đầu
  console.error(`Không tìm thấy cấu hình phù hợp cho BTC rotation slot ${btcRotationIndex + 1}/${totalSlots}`);
  btcRotationIndex = 0;
  return getNextBitcoinApi(address, retryCount + 1);
}

/**
 * Xử lý phản hồi từ API Bitcoin, trả về số dư với định dạng thống nhất
 */
function parseBitcoinApiResponse(name: string, data: any, address: string): string {
  try {
    if (name.includes('BlockCypher')) {
      if (data && typeof data.balance !== 'undefined') {
        return (data.balance / 100000000).toFixed(8);
      }
    } else if (name === 'GetBlock') {
      if (data && data.balance) {
        return (parseInt(data.balance) / 100000000).toFixed(8);
      }
    } else if (name === 'Blockchair') {
      if (data?.data?.[address]?.address?.balance) {
        return (data.data[address].address.balance / 100000000).toFixed(8);
      }
    } else if (name.includes('Blockchain.info')) {
      if (data?.[address]?.final_balance !== undefined) {
        return (data[address].final_balance / 100000000).toFixed(8);
      }
    } else if (name.includes('Blockstream') || name.includes('Mempool')) {
      if (data?.chain_stats?.funded_txo_sum !== undefined && 
          data?.chain_stats?.spent_txo_sum !== undefined) {
        const funded = data.chain_stats.funded_txo_sum;
        const spent = data.chain_stats.spent_txo_sum;
        return ((funded - spent) / 100000000).toFixed(8);
      }
    } else if (name.includes('SoChain')) {
      if (data?.status === 'success' && data?.data?.confirmed_balance) {
        return parseFloat(data.data.confirmed_balance).toFixed(8);
      }
    } else if (name === 'BTC_Tatum') {
      if (data?.incoming !== undefined && data?.outgoing !== undefined) {
        const incoming = parseFloat(data.incoming);
        const outgoing = parseFloat(data.outgoing);
        return (incoming - outgoing).toFixed(8);
      }
    }
    
    console.error(`Unable to parse response from ${name} for BTC:`, data);
    return '0';
  } catch (error) {
    console.error(`Error parsing response from ${name} for BTC:`, error);
    return '0';
  }
}

/**
 * Kiểm tra số dư Bitcoin bằng cơ chế xoay vòng thông minh với quản lý rate limit
 */
export async function checkBitcoinBalance(address: string): Promise<string> {
  try {
    // Lấy cấu hình API tiếp theo từ vòng xoay
    const apiConfig = getNextBitcoinApi(address);
    
    console.log(`Checking BTC balance for ${address} using ${apiConfig.name}`);
    
    // Sử dụng checkWithBackoff để xử lý các trường hợp bị rate limit
    return await checkWithBackoff(async () => {
      // Thực hiện request
      const fetchOptions: RequestInit = {
        method: apiConfig.method,
        headers: apiConfig.headers
      };
      
      if (apiConfig.method === 'POST' && apiConfig.body) {
        fetchOptions.body = apiConfig.body;
      }
      
      // Thêm timeout
      const controller = new AbortController();
      // Timeout cho các API BTC: BlockCypher 15s, Tatum 10s, còn lại 5s
      const timeoutDuration = apiConfig.name.includes('BlockCypher') ? 15000 : 
                            apiConfig.name === 'BTC_Tatum' ? 10000 : 5000;
      const timeout = setTimeout(() => controller.abort(), timeoutDuration);
      fetchOptions.signal = controller.signal as any;
      
      try {
        const response = await fetch(apiConfig.url, fetchOptions);
        clearTimeout(timeout);
        
        if (!response.ok) {
          // Xử lý các trường hợp rate limit
          if (response.status === 429) {
            // Đánh dấu API này đang bị rate limit
            if (apiConfig.name === 'BTC_Tatum') {
              apiRateLimiter.markKeyAsRateLimited('BTC_Tatum', 'api_key', 60000); // 1 phút timeout
            } else if (apiConfig.name.includes('BlockCypher')) {
              apiRateLimiter.markKeyAsRateLimited('BTC_BlockCypher', 'api_key', 120000); // 2 phút timeout
            } else if (apiConfig.name === 'Blockchair') {
              apiRateLimiter.markKeyAsRateLimited('BTC_Blockchair', 'public', 300000); // 5 phút timeout
            } else if (apiConfig.name === 'GetBlock') {
              apiRateLimiter.markKeyAsRateLimited('BTC_GetBlock', 'api_key', 60000); // 1 phút timeout
            } else {
              // Cho các API khác
              apiRateLimiter.markKeyAsRateLimited(`BTC_${apiConfig.name}`, 'api_key', 60000); // 1 phút timeout
            }
            
            throw { status: 429, message: 'Rate limited' };
          }
          
          // Đánh dấu API bị lỗi HTTP 402, 403, 404 là cũng đang không khả dụng
          if (response.status === 402 || response.status === 403 || response.status === 404) {
            if (apiConfig.name === 'GetBlock') {
              apiRateLimiter.markKeyAsRateLimited('BTC_GetBlock', 'api_key', 3600000); // 1 giờ timeout
              console.warn(`API ${apiConfig.name} không khả dụng (${response.status}) - Marking as unavailable for 1 hour`);
            }
          }
          
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        const balance = parseBitcoinApiResponse(apiConfig.name, data, address);
        
        console.log(`Bitcoin balance from ${apiConfig.name}: ${balance}`);
        return balance;
      } catch (error: any) {
        console.error(`Error fetching from ${apiConfig.name}:`, error);
        clearTimeout(timeout);
        
        // Kiểm tra cả thông điệp lỗi để phát hiện rate limit
        const errorMessage = error.message || '';
        if (
          (error.status === 429) || 
          errorMessage.includes('rate limit') ||
          errorMessage.includes('too many requests')
        ) {
          // Đánh dấu API này đang bị rate limit
          if (apiConfig.name === 'BTC_Tatum') {
            apiRateLimiter.markKeyAsRateLimited('BTC_Tatum', 'api_key', 60000); // 1 phút timeout
          } else if (apiConfig.name.includes('BlockCypher')) {
            apiRateLimiter.markKeyAsRateLimited('BTC_BlockCypher', 'api_key', 120000); // 2 phút timeout
          } else if (apiConfig.name === 'Blockchair') {
            apiRateLimiter.markKeyAsRateLimited('BTC_Blockchair', 'public', 300000); // 5 phút timeout
          } else {
            // Cho các API khác
            apiRateLimiter.markKeyAsRateLimited(`BTC_${apiConfig.name}`, 'api_key', 60000); // 1 phút timeout
          }
        }
        
        throw error; // Ném lỗi để cơ chế backoff hoạt động nếu cần
      }
    }).catch(error => {
      console.error(`All retries failed for ${apiConfig.name}:`, error);
      return '0'; // Trả về 0 nếu tất cả các lần thử đều thất bại
    });
  } catch (error) {
    console.error(`Error checking Bitcoin balance:`, error);
    return '0';
  }
}