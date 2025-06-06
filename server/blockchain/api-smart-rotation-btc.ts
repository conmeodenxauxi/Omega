/**
 * Cơ chế xoay vòng thông minh dành riêng cho Bitcoin
 * Xoay vòng NGẪU NHIÊN qua tất cả các endpoint và API key có sẵn, mỗi lần chỉ gọi 1 request
 * Cơ chế ngẫu nhiên giúp tránh rate limit khi nhiều phiên cùng hoạt động
 */

import { BlockchainType } from "@shared/schema";
import fetch, { RequestInit } from "node-fetch";
import { getApiKey, blockchainEndpoints } from "./api-keys";
import { checkWithBackoff } from "./api-smart-rotation-utils";

// Không còn sử dụng index tuần tự do đã chuyển sang cơ chế ngẫu nhiên
// let btcRotationIndex = 0;

// Tổng số slot trong vòng xoay BTC
let totalBtcSlots = 0;

// Cache cho quá trình tính toán slot
let btcSlotsCalculated = false;

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
              slots += endpoint.name === 'GetBlock' ? 18 : 0; // cập nhật lên 18 cho key mới thêm vào (31/03/2025)
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
 * Lấy cấu hình API tiếp theo cho Bitcoin theo cơ chế ngẫu nhiên
 * Đảm bảo mỗi request chỉ gọi 1 API duy nhất
 * Áp dụng cơ chế hoàn toàn ngẫu nhiên để tránh rate limit khi nhiều phiên cùng hoạt động
 */
function getNextBitcoinApi(address: string): {
  name: string;
  url: string;
  headers: Record<string, string>;
  method: string;
  body?: string;
} {
  // Đảm bảo đã tính toán tổng số slot
  const totalSlots = calculateTotalBtcSlots();
  
  // Chọn ngẫu nhiên một slot thay vì xoay vòng tuần tự
  const randomSlot = Math.floor(Math.random() * totalSlots);
  
  console.log(`BTC random slot: ${randomSlot + 1}/${totalSlots}`);
  
  // Lấy endpoint và API key phù hợp với vị trí ngẫu nhiên
  const endpoints = blockchainEndpoints['BTC'];
  
  // Đếm slot đã đi qua
  let passedSlots = 0;
  
  for (const endpoint of endpoints) {
    if (!endpoint.needsApiKey) {
      // Endpoint không cần API key (public endpoint)
      passedSlots += 1;
      
      if (passedSlots > randomSlot) {
        // Đã đến vị trí cần lấy
        const url = endpoint.formatUrl ? endpoint.formatUrl(address) : endpoint.url;
        const headers = endpoint.headers || { 'Content-Type': 'application/json' };
        const method = endpoint.method || 'GET';
        const body = endpoint.formatBody ? JSON.stringify(endpoint.formatBody(address)) : undefined;
        
        endpoint.callCount++;
        console.log(`[BTC Random] Đã chọn ${endpoint.name} (không cần key) - Slot ${randomSlot + 1}/${totalSlots}`);
        
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
      switch (endpoint.name) {
        case 'BlockCypher':
          // Giảm sử dụng slot BlockCypher do hay gặp timeout
          keyCount = 3; // Giảm từ 9 xuống 3 slot để tránh quá tải
          break;
        case 'GetBlock':
          keyCount = 18; // Cập nhật lên 18 cho key mới thêm vào (31/03/2025)
          break;
        case 'BTC_Tatum':
          keyCount = 15; // Tổng số key thực tế từ api-keys.ts
          break;
        default:
          keyCount = 1;
      }
      
      // Kiểm tra xem slot ngẫu nhiên có thuộc về endpoint này không
      if (randomSlot >= passedSlots && randomSlot < passedSlots + keyCount) {
        // Tính chỉ số key cần dùng
        const keyIndex = randomSlot - passedSlots;
        
        // Lấy API key theo vị trí cụ thể
        let apiKey = '';
        
        try {
          switch (endpoint.name) {
            case 'BlockCypher':
              // Lấy key từ provider BTC_BLOCKCYPHER
              apiKey = getApiKey('BTC', 'BlockCypher');
              break;
            case 'GetBlock':
              // Lấy key từ provider BTC_GETBLOCK
              apiKey = getApiKey('BTC', 'GetBlock');
              break;
            case 'BTC_Tatum':
              // Lấy key từ provider BTC_TATUM
              apiKey = getApiKey('BTC', 'BTC_Tatum');
              break;
            default:
              apiKey = getApiKey('BTC', endpoint.name);
          }
        } catch (error) {
          console.error(`Error getting API key for ${endpoint.name}:`, error);
          // Thử lại với một slot ngẫu nhiên khác
          return getNextBitcoinApi(address);
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
        console.log(`[BTC Random] Đã chọn ${endpoint.name} với API key ${apiKey.substring(0, 8)}... - Slot ${randomSlot + 1}/${totalSlots}`);
        
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
  
  // Nếu không tìm thấy cấu hình phù hợp (không nên xảy ra), thử lại với một slot ngẫu nhiên khác
  console.error(`Không tìm thấy cấu hình phù hợp cho BTC random slot ${randomSlot + 1}/${totalSlots}`);
  return getNextBitcoinApi(address);
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
 * Kiểm tra số dư Bitcoin bằng cơ chế xoay vòng ngẫu nhiên (chỉ 1 request mỗi lần)
 * Cơ chế ngẫu nhiên giúp phân tán tải khi nhiều phiên cùng hoạt động
 */
export async function checkBitcoinBalance(address: string): Promise<string> {
  try {
    // Lấy cấu hình API ngẫu nhiên
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
      // Timeout cho các API BTC: BlockCypher 30s, Blockchair 30s, Tatum 10s, còn lại 15s
      let timeoutDuration = 15000; // Mặc định cho các API khác
      
      if (apiConfig.name.includes('BlockCypher')) {
        timeoutDuration = 30000; // Tăng từ 15s lên 30s cho BlockCypher vì hay bị timeout
      } else if (apiConfig.name === 'Blockchair') {
        timeoutDuration = 30000; // Tăng lên 30s cho Blockchair vì hay bị timeout
      } else if (apiConfig.name === 'BTC_Tatum') {
        timeoutDuration = 10000; // Giữ nguyên 10s cho Tatum
      }
      
      const timeout = setTimeout(() => controller.abort(), timeoutDuration);
      fetchOptions.signal = controller.signal as any;
      
      try {
        const response = await fetch(apiConfig.url, fetchOptions);
        clearTimeout(timeout);
        
        if (!response.ok) {
          // Nếu bị rate limit, ném lỗi để kích hoạt cơ chế backoff
          if (response.status === 429) {
            throw { status: 429, message: 'Rate limited' };
          }
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        const balance = parseBitcoinApiResponse(apiConfig.name, data, address);
        
        console.log(`Bitcoin balance from ${apiConfig.name}: ${balance}`);
        return balance;
      } catch (error) {
        console.error(`Error fetching from ${apiConfig.name}:`, error);
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