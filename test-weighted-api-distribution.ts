/**
 * Script kiểm tra phân phối ngẫu nhiên có trọng số
 * So sánh hiệu quả của phương pháp mới (có trọng số) với phương pháp cũ (ngẫu nhiên đều)
 */

import { BlockchainType } from '@shared/schema';
import { 
  registerProvider, 
  reportSuccess, 
  reportError, 
  reportRateLimit, 
  selectWeightedProvider,
  getProviderWeight 
} from './server/blockchain/api-adaptive-manager';
import { checkSolanaBalance } from './server/blockchain/api-smart-rotation-sol';
import { checkBitcoinBalance } from './server/blockchain/api-smart-rotation-btc';

// Địa chỉ BTC và SOL để thử nghiệm
const TEST_ADDRESSES = {
  BTC: [
    '1NBR4kFwGDWCH2UkCnnjPAcgsxADN88xXf',
    '391E5RQa1QZmbzTRBMdPt73ZLgHe6Lqjuw',
    'bc1qn6fczp8r7qumhfundh8tzypxll09kvd89j83nr'
  ],
  SOL: [
    '7EMnQPwxHo6HGHGa7WK5KBT1NkpQfai9jxq23GBQ3Uf6',
    'GYQtJDAB2mS9ZRYxgw8gKDPvoA6hziyiwL9mYjPoCX8c',
    'FjYwGSgAycVrqYP2ZR1R1AdQUBYZHkSawhPPrhHfskCs'
  ]
};

/**
 * Kiểm tra hiệu suất của hệ thống weight với BTC
 */
async function testBitcoinWeightedDistribution() {
  console.log('\n=== Kiểm tra phân phối có trọng số cho BTC ===');
  
  // Khởi tạo bộ đếm cho từng provider
  const counts: Record<string, number> = {};
  const providers = [
    'Blockstream',
    'BlockCypher',
    'GetBlock',
    'BTC_Tatum',
    'BlockCypher Public'
  ];
  
  // Đăng ký providers với hệ thống
  providers.forEach(p => registerProvider('BTC', p));
  
  // In trọng số ban đầu
  console.log('Trọng số ban đầu:');
  providers.forEach(p => {
    console.log(`- ${p}: ${getProviderWeight('BTC', p)}`);
  });
  
  // Thực hiện nhiều lần kiểm tra BTC balance
  console.log('\nBắt đầu kiểm tra 15 request BTC - vòng 1...');
  
  for (let i = 0; i < 15; i++) {
    const address = TEST_ADDRESSES.BTC[i % TEST_ADDRESSES.BTC.length];
    const balance = await checkBitcoinBalance(address);
    
    // Đợi một chút để tránh rate limit
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // In trọng số sau vòng 1
  console.log('\nTrọng số sau 15 request:');
  providers.forEach(p => {
    console.log(`- ${p}: ${getProviderWeight('BTC', p)}`);
  });
  
  // Thử nghiệm phân phối sau khi đã có trọng số
  console.log('\nKiểm tra phân phối sau khi có trọng số:');
  
  // Reset bộ đếm
  providers.forEach(p => {
    counts[p] = 0;
  });
  
  // Thực hiện chọn provider với trọng số 30 lần
  for (let i = 0; i < 30; i++) {
    const provider = selectWeightedProvider('BTC', providers);
    counts[provider] = (counts[provider] || 0) + 1;
  }
  
  // In kết quả
  console.log('Kết quả phân phối sau khi có trọng số:');
  providers.forEach(p => {
    console.log(`- ${p}: ${counts[p]} lần (${(counts[p]/30*100).toFixed(1)}%)`);
  });
}

/**
 * Kiểm tra hiệu suất của hệ thống weight với SOL
 */
async function testSolanaWeightedDistribution() {
  console.log('\n=== Kiểm tra phân phối có trọng số cho SOL ===');
  
  // Khởi tạo bộ đếm cho từng provider
  const counts: Record<string, number> = {};
  
  // Thực hiện nhiều lần kiểm tra SOL balance
  console.log('\nBắt đầu kiểm tra 9 request SOL - vòng 1...');
  
  for (let i = 0; i < 9; i++) {
    const address = TEST_ADDRESSES.SOL[i % TEST_ADDRESSES.SOL.length];
    try {
      const balance = await checkSolanaBalance(address);
      
      // Đợi một chút để tránh rate limit
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`Lỗi kiểm tra SOL balance: ${error}`);
    }
  }
  
  // Lấy danh sách providers từ weighted selection
  const providers = [
    'Solana-RPC-MainNet',
    'Helius-1',
    'Helius-2',
    'Helius-3'
  ];
  
  // In trọng số hiện tại
  console.log('\nTrọng số sau 9 request:');
  providers.forEach(p => {
    console.log(`- ${p}: ${getProviderWeight('SOL', p)}`);
  });
  
  // Thử nghiệm phân phối sau khi đã có trọng số
  console.log('\nKiểm tra phân phối sau khi có trọng số:');
  
  // Reset bộ đếm
  providers.forEach(p => {
    counts[p] = 0;
  });
  
  // Thực hiện chọn provider với trọng số 30 lần
  for (let i = 0; i < 20; i++) {
    const provider = selectWeightedProvider('SOL', providers);
    counts[provider] = (counts[provider] || 0) + 1;
  }
  
  // In kết quả
  console.log('Kết quả phân phối sau khi có trọng số:');
  providers.forEach(p => {
    console.log(`- ${p}: ${counts[p] || 0} lần (${((counts[p] || 0)/20*100).toFixed(1)}%)`);
  });
}

/**
 * Chạy tất cả các kiểm tra
 */
async function runAllTests() {
  console.log('=== Bắt đầu kiểm tra phân phối có trọng số ===');
  
  // Chạy các kiểm tra
  await testBitcoinWeightedDistribution();
  await testSolanaWeightedDistribution();
  
  console.log('\n=== Kết thúc kiểm tra phân phối có trọng số ===');
}

// Chạy tất cả các kiểm tra
runAllTests().catch(console.error);