/**
 * Script kiểm tra API key mới đã thêm vào hệ thống (31/03/2025)
 */

import { BlockchainType } from './shared/schema';
import fetch from 'node-fetch';
import { getApiKey } from './server/blockchain/api-keys';

// Địa chỉ ví nổi tiếng để test
const FAMOUS_BTC_ADDRESS = '1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ'; // Địa chỉ ví Binance
const FAMOUS_SOL_ADDRESS = 'GUfCR9mK6azb9vcpsxgXyj7XRPAKJd4KMHTTVvtncGgp'; // Địa chỉ ví nổi tiếng

/**
 * Kiểm tra key GetBlock mới cho Bitcoin
 */
async function testGetBlockKey(apiKey: string) {
  console.log('🔍 Kiểm tra key GetBlock mới...');
  const url = `https://go.getblock.io/${apiKey}/api/v2/address/${FAMOUS_BTC_ADDRESS}?details=basic`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data: any = await response.json();
    
    // GetBlock trả về dữ liệu trực tiếp mà không có thuộc tính result
    if (data && (data.balance !== undefined || data.address)) {
      console.log('✅ GetBlock API key hoạt động tốt!');
      console.log(`  Địa chỉ: ${data.address || FAMOUS_BTC_ADDRESS}`);
      console.log(`  Số dư: ${data.balance} satoshi`);
      console.log(`  Tổng nhận: ${data.totalReceived}`);
      console.log(`  Tổng gửi: ${data.totalSent}`);
      console.log(`  Số giao dịch: ${data.txs}`);
      return true;
    } else {
      console.log('❌ GetBlock API key không hoạt động');
      console.log('  Phản hồi:', JSON.stringify(data));
      return false;
    }
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra GetBlock API key:', error);
    return false;
  }
}

/**
 * Kiểm tra key Helius mới cho Solana
 */
async function testHeliusKey(apiKey: string) {
  console.log('🔍 Kiểm tra key Helius mới...');
  const url = `https://api.helius.xyz/v0/addresses/${FAMOUS_SOL_ADDRESS}/balances?api-key=${apiKey}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data: any = await response.json();
    
    if (data && data.nativeBalance !== undefined) {
      console.log('✅ Helius API key hoạt động tốt!');
      console.log(`  Địa chỉ: ${FAMOUS_SOL_ADDRESS}`);
      console.log(`  Số dư gốc: ${data.nativeBalance} lamports`);
      console.log(`  Số token: ${data.tokens ? data.tokens.length : 0}`);
      return true;
    } else {
      console.log('❌ Helius API key không hoạt động');
      console.log('  Phản hồi:', JSON.stringify(data));
      return false;
    }
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra Helius API key:', error);
    return false;
  }
}

/**
 * Chạy kiểm tra tất cả key mới
 */
async function testAllNewKeys() {
  console.log('==== KIỂM TRA CÁC API KEY MỚI (31/03/2025) ====');
  
  // Lấy key mới từ hệ thống rotation
  const getBlockKey = '0186e2e5708f432cbc7e67288e4295ae';
  const heliusKey1 = '88b6a5c4-a828-4f13-84aa-f84798b44234';
  const heliusKey2 = '4ae0a4eb-2f7f-419f-bba8-92899bfee440';
  
  // Kiểm tra từng key
  console.log('\n1. Kiểm tra GetBlock key cho BTC:');
  const getBlockResult = await testGetBlockKey(getBlockKey);
  
  console.log('\n2. Kiểm tra Helius key 1 cho SOL:');
  const helius1Result = await testHeliusKey(heliusKey1);
  
  console.log('\n3. Kiểm tra Helius key 2 cho SOL:');
  const helius2Result = await testHeliusKey(heliusKey2);
  
  // Kết luận
  console.log('\n==== KẾT QUẢ KIỂM TRA ====');
  console.log(`GetBlock key (BTC): ${getBlockResult ? '✅ Hoạt động' : '❌ Không hoạt động'}`);
  console.log(`Helius key 1 (SOL): ${helius1Result ? '✅ Hoạt động' : '❌ Không hoạt động'}`);
  console.log(`Helius key 2 (SOL): ${helius2Result ? '✅ Hoạt động' : '❌ Không hoạt động'}`);
  
  const allWorking = getBlockResult && helius1Result && helius2Result;
  console.log(`\nTổng kết: ${allWorking ? '✅ Tất cả key đều hoạt động tốt!' : '⚠️ Một số key không hoạt động, vui lòng kiểm tra lại'}`);
}

// Chạy test
testAllNewKeys()
  .then(() => console.log('Kiểm tra hoàn tất'))
  .catch(error => console.error('Lỗi khi chạy kiểm tra:', error));