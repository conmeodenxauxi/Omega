/**
 * Cơ chế xoay vòng thông minh dành riêng cho Bitcoin
 * Tỷ lệ 1:3 giữa BlockCypher và các API khác (1 lần BlockCypher, 3 lần API khác)
 * Các RPC miễn phí được xem là một "slot" trong vòng xoay như API key
 */

import { getApiKey } from './api-keys';

// Biến đếm lượt gọi API để xác định thời điểm sử dụng BlockCypher
let callCycleCounter = 0;

// API bị giới hạn đặc biệt (200 req/giờ/key)
const limitedApi = 'BlockCypher';

// Danh sách tất cả các API endpoint có sẵn (không bao gồm BlockCypher)
// Số lượng key thực sự sẽ phụ thuộc vào số lượng API key được cấu hình
const allApiEndpoints = [
  // Free public RPC (mỗi RPC = 1 slot)
  'Blockchain.info', // Free RPC 1
  'Blockstream',    // Free RPC 2
  'Mempool',        // Free RPC 3
  
  // API tính phí (mỗi key = 1 slot)
  // GetBlock: 17 key
  'GetBlock', // Đại diện cho 17 key, sẽ được xoay vòng bên trong
  
  // BTC_Tatum: 10 key
  'BTC_Tatum' // Đại diện cho 10 key, sẽ được xoay vòng bên trong
];

// Chỉ số hiện tại trong danh sách API để xoay vòng
let currentApiIndex = 0;

/**
 * Lấy API endpoint tiếp theo cho Bitcoin theo tỷ lệ 1:3 (BlockCypher:API khác)
 * @returns Tên endpoint được chọn 
 */
export function getNextBitcoinEndpoint(): string {
  // Tăng bộ đếm chu kỳ
  callCycleCounter++;
  
  // Mỗi 4 lần gọi, sử dụng 1 lần BlockCypher để duy trì tỷ lệ 1:3
  if (callCycleCounter % 4 === 0) {
    return limitedApi; // Trả về BlockCypher cho lần gọi thứ 4, 8, 12...
  }
  
  // Lấy API tiếp theo từ danh sách xoay vòng
  const apiEndpoint = allApiEndpoints[currentApiIndex];
  
  // Tăng chỉ số cho lần gọi tiếp theo
  currentApiIndex = (currentApiIndex + 1) % allApiEndpoints.length;
  
  return apiEndpoint;
}

/**
 * Lấy cấu hình API tiếp theo cho Bitcoin dựa trên chiến lược xoay vòng thông minh
 * @param address Địa chỉ ví Bitcoin
 * @returns Cấu hình API bao gồm URL, headers, method
 */
export function getNextBitcoinApiConfig(address: string): {
  name: string;
  url: string;
  headers: Record<string, string>;
  method: string;
  body?: any;
} {
  const endpointName = getNextBitcoinEndpoint();
  let url = '';
  let headers: Record<string, string> = { 'Content-Type': 'application/json' };
  let method = 'GET';
  let apiKey = '';
  
  switch (endpointName) {
    case 'BlockCypher':
      // Lấy BlockCypher API key (xoay vòng tự động bên trong)
      apiKey = getApiKey('BTC', 'BlockCypher');
      url = `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance?token=${apiKey}`;
      break;
      
    case 'GetBlock':
      // Lấy GetBlock API key
      apiKey = getApiKey('BTC', 'GetBlock');
      url = `https://go.getblock.io/${apiKey}/api/v2/address/${address}?details=basic`;
      break;
      
    case 'BTC_Tatum':
      // Lấy Tatum API key
      apiKey = getApiKey('BTC', 'BTC_Tatum');
      url = `https://api.tatum.io/v3/bitcoin/address/balance/${address}`;
      headers['x-api-key'] = apiKey;
      break;
      
    case 'Blockchain.info':
      url = `https://blockchain.info/balance?active=${address}`;
      break;
      
    case 'Blockstream':
    case 'Mempool':
      url = `https://blockstream.info/api/address/${address}`;
      break;
      
    default:
      // Fallback to BlockCypher Public nếu không có endpoint phù hợp
      url = `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`;
  }
  
  return {
    name: endpointName,
    url,
    headers,
    method
  };
}

/**
 * Xử lý phản hồi từ API Bitcoin, trả về số dư với định dạng thống nhất
 * @param name Tên API
 * @param data Dữ liệu phản hồi
 * @param address Địa chỉ ví
 * @returns Số dư định dạng chuỗi hoặc '0' nếu không có dữ liệu
 */
export function parseBitcoinApiResponse(name: string, data: any, address: string): string {
  try {
    if (!data) return '0';
    
    switch (name) {
      case 'BlockCypher':
        if (data && typeof data.balance !== 'undefined') {
          return (data.balance / 100000000).toFixed(8);
        }
        break;
        
      case 'GetBlock':
        if (data && data.balance) {
          return (parseInt(data.balance) / 100000000).toFixed(8);
        }
        break;
        
      case 'BTC_Tatum':
        if (data && data.incoming && data.outgoing) {
          const incomingSat = parseInt(data.incoming) || 0;
          const outgoingSat = parseInt(data.outgoing) || 0;
          return ((incomingSat - outgoingSat) / 100000000).toFixed(8);
        }
        break;
        
      case 'Blockchain.info':
        if (data?.[address]?.final_balance !== undefined) {
          return (data[address].final_balance / 100000000).toFixed(8);
        }
        break;
        
      case 'Blockstream':
      case 'Mempool':
        if (data?.chain_stats?.funded_txo_sum !== undefined && 
            data?.chain_stats?.spent_txo_sum !== undefined) {
          const funded = data.chain_stats.funded_txo_sum;
          const spent = data.chain_stats.spent_txo_sum;
          return ((funded - spent) / 100000000).toFixed(8);
        }
        break;
    }
    
    return '0';
  } catch (error) {
    console.error(`Lỗi khi xử lý phản hồi từ ${name}:`, error);
    return '0';
  }
}

/**
 * Kiểm tra số dư Bitcoin bằng cơ chế xoay vòng thông minh
 * @param address Địa chỉ ví Bitcoin
 * @returns Số dư Bitcoin (định dạng chuỗi)
 */
export async function checkBitcoinBalance(address: string): Promise<string> {
  console.log(`Checking BTC balance for ${address} using smart rotation API`);
  
  // Biến lưu trữ kết quả và lỗi
  let lastError: Error | null = null;
  
  // Thử tối đa 5 lần
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const config = getNextBitcoinApiConfig(address);
      
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.method === 'POST' ? JSON.stringify(config.body) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} from ${config.name}`);
      }
      
      const data = await response.json();
      const balance = parseBitcoinApiResponse(config.name, data, address);
      
      console.log(`${config.name} balance for BTC:${address}: ${balance}`);
      
      // Kiểm tra nếu balance hợp lệ
      if (balance && !isNaN(parseFloat(balance))) {
        return balance;
      }
      
      // Nếu không tìm thấy số dư hợp lệ, thử lại với API tiếp theo
    } catch (error) {
      console.error(`Error with attempt ${attempt + 1}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      // Tiếp tục thử với API tiếp theo
    }
  }
  
  // Nếu đã thử tất cả các API mà không có kết quả, throw lỗi
  throw lastError || new Error(`Không thể kiểm tra số dư Bitcoin cho địa chỉ ${address}`);
}