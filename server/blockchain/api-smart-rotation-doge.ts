/**
 * Cơ chế xoay vòng thông minh dành riêng cho Dogecoin
 * Kết hợp Tatum và NowNodes với tỷ lệ 3:1
 */

import { BlockchainType } from '@shared/schema';
import { getApiKey } from './api-keys';

// Đếm số lần gọi để đảm bảo tỷ lệ 3:1
let callCount = 0;

/**
 * Lấy API endpoint tiếp theo cho Dogecoin theo tỷ lệ 3:1 (Tatum:NowNodes)
 * @returns Tên endpoint được chọn ('Tatum' hoặc 'NowNodes')
 */
export function getNextDogecoinEndpoint(): 'Tatum' | 'NowNodes' {
  // Tăng biến đếm
  callCount++;
  
  // Đảm bảo tỷ lệ 3:1 (Tatum:NowNodes)
  // Chọn NowNodes cho mỗi lần gọi thứ 4
  if (callCount % 4 === 0) {
    console.log('Dogecoin rotation: Chọn NowNodes (1/4)');
    return 'NowNodes';
  } else {
    console.log(`Dogecoin rotation: Chọn Tatum (${callCount % 4}/4)`);
    return 'Tatum';
  }
}

/**
 * Lấy cấu hình API tiếp theo cho Dogecoin dựa trên chiến lược xoay vòng thông minh
 * @param address Địa chỉ ví Dogecoin
 * @returns Cấu hình API bao gồm URL, headers, method
 */
export function getNextDogecoinApiConfig(address: string): {
  name: string;
  url: string;
  headers: Record<string, string>;
  method: string;
} {
  // Chọn endpoint theo tỷ lệ 3:1
  const endpointName = getNextDogecoinEndpoint();
  
  // Lấy API key cho endpoint tương ứng
  const apiKey = getApiKey('DOGE', endpointName);
  
  if (endpointName === 'Tatum') {
    return {
      name: 'Tatum',
      url: `https://api.tatum.io/v3/dogecoin/address/balance/${address}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      method: 'GET'
    };
  } else {
    return {
      name: 'NowNodes',
      url: `https://dogebook.nownodes.io/api/address/${address}`,
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      method: 'GET'
    };
  }
}

/**
 * Xử lý phản hồi từ API Dogecoin, trả về số dư với định dạng thống nhất
 * @param name Tên API
 * @param data Dữ liệu phản hồi
 * @returns Số dư định dạng chuỗi hoặc '0' nếu không có dữ liệu
 */
export function parseDogecoinApiResponse(name: string, data: any): string {
  try {
    if (!data) return '0';
    
    if (name === 'Tatum') {
      // Format phản hồi từ Tatum
      if (data.incoming && data.outgoing) {
        const incoming = parseFloat(data.incoming) || 0;
        const outgoing = parseFloat(data.outgoing) || 0;
        return (incoming - outgoing).toString();
      }
    } else if (name === 'NowNodes') {
      // Format phản hồi từ NowNodes
      if (data.balance !== undefined) {
        return data.balance.toString();
      } else if (data.final_balance !== undefined) {
        return data.final_balance.toString();
      }
    }
    
    return '0';
  } catch (error) {
    console.error(`Lỗi khi xử lý phản hồi từ ${name}:`, error);
    return '0';
  }
}

/**
 * Kiểm tra số dư Dogecoin bằng cơ chế xoay vòng thông minh
 * @param address Địa chỉ ví Dogecoin
 * @returns Số dư Dogecoin (định dạng chuỗi)
 */
export async function checkDogecoinBalance(address: string): Promise<string> {
  try {
    // Lấy cấu hình API tiếp theo
    const apiConfig = getNextDogecoinApiConfig(address);
    
    // Thực hiện HTTP request
    const response = await fetch(apiConfig.url, {
      method: apiConfig.method,
      headers: apiConfig.headers
    });
    
    // Kiểm tra và xử lý phản hồi
    if (response.ok) {
      const data = await response.json();
      return parseDogecoinApiResponse(apiConfig.name, data);
    } else {
      console.error(`Lỗi khi gọi API ${apiConfig.name}: ${response.status} ${response.statusText}`);
      return '0';
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra số dư Dogecoin:', error);
    return '0';
  }
}