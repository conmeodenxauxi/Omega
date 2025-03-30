/**
 * Cơ chế kiểm tra số dư song song cho các địa chỉ ví trên nhiều blockchain
 * Cho phép kiểm tra đồng thời các địa chỉ, tăng tốc quá trình quét
 */

import { BlockchainType, BalanceCheckResult } from '../../shared/schema';
import { checkBitcoinBalance } from './api-smart-rotation-btc';
import { checkEthereumBalance } from './api-smart-rotation-eth';
import { checkBscBalance } from './api-smart-rotation-bsc';
import { checkSolanaBalance } from './api-smart-rotation-sol';
import { checkDogecoinBalance } from './api-smart-rotation-doge';

// Thiết lập mức độ song song tối đa cho mỗi blockchain
const MAX_CONCURRENT_CHECKS = {
  BTC: 60,  // Tối đa 60 request song song cho BTC
  ETH: 20,  // Tối đa 20 request song song cho ETH
  BSC: 20,  // Tối đa 20 request song song cho BSC
  SOL: 20,  // Tối đa 20 request song song cho SOL
  DOGE: 20  // Tối đa 20 request song song cho DOGE
};

// Quản lý số lượng request đang xử lý cho mỗi blockchain
const activeRequests: Record<BlockchainType, number> = {
  BTC: 0,
  ETH: 0,
  BSC: 0,
  SOL: 0,
  DOGE: 0
};

/**
 * Kiểm tra số dư cho một địa chỉ cụ thể với cơ chế giới hạn song song
 * @param blockchain Loại blockchain
 * @param address Địa chỉ ví
 */
export async function checkBalanceWithRateLimit(blockchain: BlockchainType, address: string): Promise<string> {
  // Kiểm tra xem có đang đạt giới hạn song song không
  while (activeRequests[blockchain] >= MAX_CONCURRENT_CHECKS[blockchain]) {
    // Nếu đã đạt giới hạn, đợi một chút trước khi thử lại
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Tăng số lượng request đang xử lý
  activeRequests[blockchain]++;

  try {
    // Thực hiện kiểm tra số dư dựa trên loại blockchain
    let balance = '0';
    switch (blockchain) {
      case 'BTC':
        balance = await checkBitcoinBalance(address);
        break;
      case 'ETH':
        balance = await checkEthereumBalance(address);
        break;
      case 'BSC':
        balance = await checkBscBalance(address);
        break;
      case 'SOL':
        balance = await checkSolanaBalance(address);
        break;
      case 'DOGE':
        balance = await checkDogecoinBalance(address);
        break;
    }
    return balance;
  } finally {
    // Giảm số lượng request đang xử lý khi hoàn thành
    activeRequests[blockchain]--;
  }
}

/**
 * Kiểm tra song song số dư cho danh sách các địa chỉ trên các blockchain
 * @param addresses Danh sách các đối tượng {blockchain, address}
 * @returns Danh sách kết quả kiểm tra số dư
 */
export async function checkBalancesInParallel(
  addresses: Array<{ blockchain: BlockchainType; address: string }>
): Promise<BalanceCheckResult[]> {
  console.log(`Bắt đầu kiểm tra ${addresses.length} địa chỉ song song trên tất cả các blockchain`);

  // Tạo mảng các promise để kiểm tra song song
  const checkPromises = addresses.map(async ({ blockchain, address }) => {
    try {
      const balance = await checkBalanceWithRateLimit(blockchain, address);
      const hasBalance = parseFloat(balance) > 0;

      // Nếu có số dư dương, in ra thông báo
      if (hasBalance) {
        console.log(`Found positive ${blockchain} balance for ${address}: ${balance}`);
      }

      // Trả về kết quả kiểm tra
      return {
        address,
        balance,
        hasBalance,
        blockchain
      };
    } catch (error) {
      console.error(`Error checking ${blockchain} balance for ${address}:`, error);
      // Trả về kết quả với số dư bằng 0 nếu có lỗi
      return {
        address,
        balance: '0',
        hasBalance: false,
        blockchain
      };
    }
  });

  // Đợi tất cả các promise hoàn thành và trả về kết quả
  return Promise.all(checkPromises);
}

/**
 * Kiểm tra song song các nhóm địa chỉ trên các blockchain khác nhau
 * Phương pháp này giúp xử lý số lượng lớn địa chỉ mà vẫn kiểm soát được tải
 * @param addressGroups Nhóm các địa chỉ theo blockchain
 */
export async function checkBalancesByBlockchain(
  addressGroups: Record<BlockchainType, string[]>
): Promise<Record<BlockchainType, BalanceCheckResult[]>> {
  // Chuyển đổi thành cấu trúc phẳng để xử lý song song
  const flatAddresses: Array<{ blockchain: BlockchainType; address: string }> = [];
  
  Object.entries(addressGroups).forEach(([blockchain, addresses]) => {
    addresses.forEach(address => {
      flatAddresses.push({
        blockchain: blockchain as BlockchainType,
        address
      });
    });
  });

  // Kiểm tra song song tất cả địa chỉ
  const results = await checkBalancesInParallel(flatAddresses);

  // Nhóm kết quả lại theo blockchain
  const resultsByBlockchain: Record<BlockchainType, BalanceCheckResult[]> = {
    BTC: [],
    ETH: [],
    BSC: [],
    SOL: [],
    DOGE: []
  };

  results.forEach(result => {
    resultsByBlockchain[result.blockchain].push(result);
  });

  return resultsByBlockchain;
}