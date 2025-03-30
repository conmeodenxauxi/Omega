/**
 * Script kiểm tra API key mới của GetBlock.io
 */

import fetch from 'node-fetch';

// Key mới thêm vào
const newApiKey = '72ac9da16bc4458ca57dfe0dc61fa8b2';

// Địa chỉ Bitcoin có số dư để kiểm tra
const testAddresses = [
  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', // Địa chỉ có số dư
  '1MzKr1UHZQqAQrNuWSGrBVpdcCQPGtz1af'        // Địa chỉ có số dư
];

/**
 * Kiểm tra API key của GetBlock
 */
async function testGetBlockKey(apiKey, address) {
  const url = `https://go.getblock.io/${apiKey}/api/v2/address/${address}?details=basic`;
  
  try {
    console.log(`Đang kiểm tra với địa chỉ ${address}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data && data.balance) {
      const btcBalance = (parseInt(data.balance) / 100000000).toFixed(8);
      console.log(`✅ API key hoạt động tốt! Địa chỉ ${address} có số dư: ${btcBalance} BTC`);
      return true;
    } else {
      console.log(`❌ Lỗi khi kiểm tra số dư:`, data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Lỗi khi gọi API GetBlock:`, error.message);
    return false;
  }
}

/**
 * Chạy tất cả các kiểm tra
 */
async function runTests() {
  console.log(`====== KIỂM TRA API KEY MỚI CỦA GETBLOCK ======`);
  console.log(`API key: ${newApiKey}`);
  
  let success = false;
  
  for (const address of testAddresses) {
    success = await testGetBlockKey(newApiKey, address);
    if (success) break;
  }
  
  if (success) {
    console.log(`\n✅✅✅ KEY MỚI HOẠT ĐỘNG TỐT! ✅✅✅`);
  } else {
    console.log(`\n❌❌❌ CÓ VẤN ĐỀ VỚI API KEY MỚI! ❌❌❌`);
  }
}

// Chạy các kiểm tra
runTests();