/**
 * Cơ chế xoay vòng thông minh dành riêng cho Bitcoin
 * Xoay vòng qua tất cả các endpoint và API key có sẵn, mỗi lần chỉ gọi 1 request
 */

import { BlockchainType } from "@shared/schema";
import fetch, { RequestInit } from "node-fetch";
import { getApiKey, blockchainEndpoints } from "./api-keys";

// Index hiện tại trong vòng xoay BTC
let btcRotationIndex = 0;

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
      slots += 1;
    } else {
      // Endpoint cần API key
      switch (endpoint.name) {
        case 'BlockCypher':
          // Lấy số lượng key từ provider BTC_BLOCKCYPHER
          try {
            const testKey = getApiKey('BTC', 'BlockCypher');
            if (testKey) {
              // Nếu getApiKey thành công, đếm số slot bằng số key có sẵn
              slots += endpoint.name === 'BlockCypher' ? 9 : 0; // thay bằng số thực tế từ api-keys.ts
            }
          } catch (error) {
            console.log(`Không có API key nào cho ${endpoint.name}`);
          }
          break;
        case 'GetBlock':
          // Lấy số lượng key từ provider BTC_GETBLOCK
          try {
            const testKey = getApiKey('BTC', 'GetBlock');
            if (testKey) {
              slots += endpoint.name === 'GetBlock' ? 17 : 0; // thay bằng số thực tế từ api-keys.ts
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
              slots += endpoint.name === 'BTC_Tatum' ? 15 : 0; // thay bằng số thực tế từ api-keys.ts
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
 * Lấy cấu hình API tiếp theo cho Bitcoin theo vòng xoay
 * Đảm bảo mỗi request chỉ gọi 1 API duy nhất
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
        // Đã đến vị trí cần lấy
        const url = endpoint.formatUrl ? endpoint.formatUrl(address) : endpoint.url;
        const headers = endpoint.headers || { 'Content-Type': 'application/json' };
        const method = endpoint.method || 'GET';
        const body = endpoint.formatBody ? JSON.stringify(endpoint.formatBody(address)) : undefined;
        
        endpoint.callCount++;
        console.log(`[BTC Rotation] Đã chọn ${endpoint.name} (không cần key) - Slot ${btcRotationIndex + 1}/${totalSlots}`);
        
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
          keyCount = 9; // thay bằng số thực tế từ api-keys.ts
          break;
        case 'GetBlock':
          keyCount = 17; // thay bằng số thực tế từ api-keys.ts
          break;
        case 'BTC_Tatum':
          keyCount = 15; // thay bằng số thực tế từ api-keys.ts
          break;
        default:
          keyCount = 1;
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
              // Lấy key từ provider BTC_BLOCKCYPHER với index cụ thể
              apiKey = getApiKey('BTC', 'BlockCypher');
              break;
            case 'GetBlock':
              // Lấy key từ provider BTC_GETBLOCK với index cụ thể
              apiKey = getApiKey('BTC', 'GetBlock');
              break;
            case 'BTC_Tatum':
              // Lấy key từ provider BTC_TATUM với index cụ thể
              apiKey = getApiKey('BTC', 'BTC_Tatum');
              break;
            default:
              apiKey = getApiKey('BTC', endpoint.name);
          }
        } catch (error) {
          console.error(`Error getting API key for ${endpoint.name}:`, error);
          // Xoay vòng lại nếu không lấy được key
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
 * Kiểm tra số dư Bitcoin bằng cơ chế xoay vòng tuần tự (chỉ 1 request mỗi lần)
 */
export async function checkBitcoinBalance(address: string): Promise<string> {
  try {
    // Lấy cấu hình API tiếp theo từ vòng xoay
    const apiConfig = getNextBitcoinApi(address);
    
    console.log(`Checking BTC balance for ${address} using ${apiConfig.name}`);
    
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
    const timeout = setTimeout(() => controller.abort(), 15000); // Tăng từ 5s lên 15s
    fetchOptions.signal = controller.signal as any;
    
    try {
      const response = await fetch(apiConfig.url, fetchOptions);
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      const balance = parseBitcoinApiResponse(apiConfig.name, data, address);
      
      console.log(`Bitcoin balance from ${apiConfig.name}: ${balance}`);
      return balance;
    } catch (error) {
      console.error(`Error fetching from ${apiConfig.name}:`, error);
      clearTimeout(timeout);
      return '0';
    }
  } catch (error) {
    console.error(`Error checking Bitcoin balance:`, error);
    return '0';
  }
}