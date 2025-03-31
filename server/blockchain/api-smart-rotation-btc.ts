/**
 * Cơ chế phân bổ ngẫu nhiên dành riêng cho Bitcoin
 * Chọn ngẫu nhiên một endpoint hoặc API key từ tất cả các endpoint và API key có sẵn,
 * mỗi lần chỉ gọi 1 request để tránh race condition và đảm bảo sử dụng đồng đều các API
 */

import { BlockchainType } from "@shared/schema";
import fetch, { RequestInit } from "node-fetch";
import { getApiKey, blockchainEndpoints } from "./api-keys";
import { checkWithBackoff } from "./api-smart-rotation-utils";
import { registerProvider, reportSuccess, reportError, reportRateLimit, selectWeightedProvider } from './api-adaptive-manager';

// Tổng số slot có sẵn cho BTC
let totalBtcSlots = 0;

// Cache cho quá trình tính toán slot
let btcSlotsCalculated = false;

/**
 * Tính toán tổng số slot cho phân bổ ngẫu nhiên BTC
 * Mỗi RPC public không cần key được tính là 1 slot
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
  console.log(`Tổng số slot có sẵn cho phân bổ ngẫu nhiên BTC: ${totalBtcSlots}`);
  
  return totalBtcSlots;
}

/**
 * Lấy cấu hình API cho Bitcoin sử dụng phân bổ ngẫu nhiên có trọng số
 * Đảm bảo mỗi request chỉ gọi 1 API duy nhất và phân tán dựa trên hiệu suất của các API
 */
function getNextBitcoinApi(address: string): {
  name: string;
  url: string;
  headers: Record<string, string>;
  method: string;
  body?: string;
} {
  // Lấy danh sách các endpoints Bitcoin
  const endpoints = blockchainEndpoints['BTC'];
  
  // Đăng ký tất cả các providers với hệ thống quản lý API thích ứng
  for (const endpoint of endpoints) {
    registerProvider('BTC', endpoint.name);
  }
  
  // Chọn provider dựa trên trọng số (nếu có từ 3 providers trở lên)
  let chosenProvider;
  const providers = ['BlockCypher', 'GetBlock', 'BTC_Tatum', 'BlockCypher Public', 'Blockchair', 'Blockchain.info', 'Blockstream'];
  
  if (providers.length >= 3) {
    // Sử dụng hệ thống quản lý API thích ứng để chọn provider
    chosenProvider = selectWeightedProvider('BTC', providers);
    console.log(`[BTC Weighted] Đã chọn ${chosenProvider} dựa trên trọng số`);
  } else {
    // Đảm bảo đã tính toán tổng số slot
    const totalSlots = calculateTotalBtcSlots();
    
    // Chọn một slot ngẫu nhiên thay vì xoay tuần tự
    const randomSlot = Math.floor(Math.random() * totalSlots);
    console.log(`BTC random slot: ${randomSlot + 1}/${totalSlots}`);
    
    // Đếm slot đã đi qua
    let passedSlots = 0;
    
    // Tìm provider phù hợp với slot ngẫu nhiên
    for (const endpoint of endpoints) {
      if (!endpoint.needsApiKey) {
        passedSlots += 1;
        if (passedSlots > randomSlot) {
          chosenProvider = endpoint.name;
          break;
        }
      } else {
        // Endpoint cần API key - tính số slot dựa vào số lượng key
        let keyCount = 0;
        switch (endpoint.name) {
          case 'BlockCypher': keyCount = 3; break;
          case 'GetBlock': keyCount = 17; break;
          case 'BTC_Tatum': keyCount = 15; break;
          default: keyCount = 1;
        }
        
        if (randomSlot >= passedSlots && randomSlot < passedSlots + keyCount) {
          chosenProvider = endpoint.name;
          break;
        }
        
        passedSlots += keyCount;
      }
    }
    
    // Nếu không tìm thấy, mặc định sử dụng Blockstream (public API an toàn)
    if (!chosenProvider) {
      chosenProvider = 'Blockstream';
    }
  }
  
  // Tìm endpoint cấu hình cho provider đã chọn
  const chosenEndpoint = endpoints.find(ep => ep.name === chosenProvider);
  
  if (!chosenEndpoint) {
    console.error(`Không tìm thấy cấu hình cho provider ${chosenProvider}, thử lại`);
    return getNextBitcoinApi(address);
  }
  
  // Xử lý endpoint đã chọn
  try {
    // Chuẩn bị URL, headers, và body
    let apiKey = '';
    if (chosenEndpoint.needsApiKey) {
      // Lấy API key theo provider
      try {
        apiKey = getApiKey('BTC', chosenEndpoint.name);
      } catch (error) {
        console.error(`Không thể lấy API key cho ${chosenEndpoint.name}:`, error);
        // Chọn lại một provider khác
        const otherProviders = providers.filter(p => p !== chosenProvider);
        if (otherProviders.length > 0) {
          const fallbackProvider = otherProviders[Math.floor(Math.random() * otherProviders.length)];
          console.log(`Chuyển sang provider backup: ${fallbackProvider}`);
          return getNextBitcoinApi(address);
        }
      }
    }
    
    // Chuẩn bị URL
    const url = chosenEndpoint.formatUrl 
      ? chosenEndpoint.formatUrl(address, apiKey) 
      : chosenEndpoint.url;
    
    // Chuẩn bị headers
    const headers = chosenEndpoint.formatHeaders 
      ? chosenEndpoint.formatHeaders(apiKey) 
      : (chosenEndpoint.headers || { 'Content-Type': 'application/json' });
    
    // Chuẩn bị body nếu cần
    const body = chosenEndpoint.formatBody 
      ? JSON.stringify(chosenEndpoint.formatBody(address, apiKey)) 
      : undefined;
    
    // Tăng số lần gọi
    chosenEndpoint.callCount++;
    
    if (apiKey) {
      console.log(`[BTC] Đã chọn ${chosenEndpoint.name} với API key ${apiKey.substring(0, 8)}...`);
    } else {
      console.log(`[BTC] Đã chọn ${chosenEndpoint.name} (không cần key)`);
    }
    
    return {
      name: chosenEndpoint.name,
      url,
      headers,
      method: chosenEndpoint.method || 'GET',
      body
    };
  } catch (error) {
    console.error(`Lỗi khi chuẩn bị request cho ${chosenProvider}:`, error);
    // Chọn lại một provider khác
    return getNextBitcoinApi(address);
  }
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
 * Kiểm tra số dư Bitcoin bằng cơ chế phân bổ ngẫu nhiên và thích ứng
 * Tích hợp với hệ thống quản lý API thích ứng để tối ưu hóa hiệu suất
 */
export async function checkBitcoinBalance(address: string): Promise<string> {
  try {
    // Lấy cấu hình API ngẫu nhiên
    const apiConfig = getNextBitcoinApi(address);
    
    // Đăng ký provider với hệ thống quản lý API
    registerProvider('BTC', apiConfig.name);
    
    console.log(`Checking BTC balance for ${address} using ${apiConfig.name}`);
    
    // Sử dụng checkWithBackoff để xử lý các trường hợp bị rate limit
    return await checkWithBackoff(async (retryCount?: number, maxRetries?: number, retryDelay?: number): Promise<string> => {
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
          // Nếu bị rate limit, báo cáo cho hệ thống quản lý API và ném lỗi
          if (response.status === 429) {
            reportRateLimit('BTC', apiConfig.name);
            throw { status: 429, message: 'Rate limited' };
          }
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        const balance = parseBitcoinApiResponse(apiConfig.name, data, address);
        
        // Báo cáo thành công cho hệ thống quản lý API
        reportSuccess('BTC', apiConfig.name);
        
        console.log(`Bitcoin balance from ${apiConfig.name}: ${balance}`);
        return balance;
      } catch (error) {
        // Xử lý và báo cáo lỗi cho hệ thống quản lý
        if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
          console.error(`Rate limited on API, backing off for ${retryDelay}ms (retry ${retryCount}/${maxRetries})`);
          // Rate limit đã được báo cáo ở trên
        } else {
          console.error(`Error fetching from ${apiConfig.name}:`, error);
          reportError('BTC', apiConfig.name);
        }
        
        clearTimeout(timeout);
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