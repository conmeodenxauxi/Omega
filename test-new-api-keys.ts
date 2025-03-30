import fetch from 'node-fetch';
import { BlockchainType } from './shared/schema';
import { getApiKey } from './server/blockchain/api-keys';

// Các địa chỉ ví nổi tiếng để kiểm tra
const FAMOUS_ADDRESSES = {
  'BTC': '1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ', // Một địa chỉ ví BTC nổi tiếng (Binance)
  'ETH': '0xda9dfa130df4de4673b89022ee50ff26f6ea73cf', // Địa chỉ ví ETH nổi tiếng (Polygon Bridge)
  'BSC': '0x8894e0a0c962cb723c1976a4421c95949be2d4e3', // Địa chỉ ví BSC nổi tiếng (Binance Hot Wallet)
};

async function testTatumBTCKey(apiKey: string) {
  const address = FAMOUS_ADDRESSES.BTC;
  const url = `https://api.tatum.io/v3/bitcoin/address/balance/${address}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });
    
    const data = await response.json();
    console.log(`BTC_TATUM API key test: ${JSON.stringify(data, null, 2)}`);
    
    // Kiểm tra xem phản hồi có chứa thông tin về số dư không
    if (data && data.incoming !== undefined && data.outgoing !== undefined) {
      console.log(`✅ BTC_TATUM API key hoạt động tốt - Số dư: ${parseFloat(data.incoming) - parseFloat(data.outgoing)}`);
      return true;
    } else {
      console.log(`❌ BTC_TATUM API key không trả về số dư đúng định dạng`);
      return false;
    }
  } catch (error) {
    console.error(`❌ BTC_TATUM API key lỗi:`, error);
    return false;
  }
}

async function testEtherscanKey(apiKey: string) {
  const address = FAMOUS_ADDRESSES.ETH;
  const url = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(`ETHERSCAN API key test: ${JSON.stringify(data, null, 2)}`);
    
    // Kiểm tra xem phản hồi có chứa thông tin về số dư không
    if (data && data.status === '1' && data.result) {
      console.log(`✅ ETHERSCAN API key hoạt động tốt - Số dư: ${data.result}`);
      return true;
    } else {
      console.log(`❌ ETHERSCAN API key không trả về số dư đúng định dạng`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ETHERSCAN API key lỗi:`, error);
    return false;
  }
}

async function testBscscanKey(apiKey: string) {
  const address = FAMOUS_ADDRESSES.BSC;
  const url = `https://api.bscscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(`BSCSCAN API key test: ${JSON.stringify(data, null, 2)}`);
    
    // Kiểm tra xem phản hồi có chứa thông tin về số dư không
    if (data && data.status === '1' && data.result) {
      console.log(`✅ BSCSCAN API key hoạt động tốt - Số dư: ${data.result}`);
      return true;
    } else {
      console.log(`❌ BSCSCAN API key không trả về số dư đúng định dạng`);
      return false;
    }
  } catch (error) {
    console.error(`❌ BSCSCAN API key lỗi:`, error);
    return false;
  }
}

// Test API Key cho Bitcoin (Tatum)
async function testBTCTatumKey() {
  const apiKey = getApiKey('BTC', 'BTC_Tatum');
  console.log(`Kiểm tra BTC_TATUM API key: ${apiKey}`);
  const result = await testTatumBTCKey(apiKey);
  return result;
}

// Test API Key cho Ethereum (Etherscan)
async function testETHKey() {
  // Kiểm tra API key mới (vị trí thứ 8 và 9 trong mảng)
  const newKeys = ['JIBT19A992QRZIS91MM1WYDPESS3R64ACX', 'K2GNPYITPPVNFYYX837KWMCJICPNAJMVSG'];
  
  console.log('Kiểm tra các ETHERSCAN API key mới:');
  let allSuccess = true;
  
  for (const key of newKeys) {
    console.log(`\nKiểm tra ETHERSCAN API key mới: ${key}`);
    const result = await testEtherscanKey(key);
    if (!result) allSuccess = false;
  }
  
  // Kiểm tra một API key thông qua hệ thống rotation
  const apiKey = getApiKey('ETH', 'Etherscan');
  console.log(`\nKiểm tra ETHERSCAN API key từ rotation: ${apiKey}`);
  const rotationResult = await testEtherscanKey(apiKey);
  
  return allSuccess && rotationResult;
}

// Test API Key cho BSC (BSCScan)
async function testBSCKey() {
  // Kiểm tra API key mới (vị trí thứ 8 và 9 trong mảng)
  const newKeys = ['YSV3J1572I7BPW7I8JG92YB1V4W9YNY4N2', 'IGWA6ZTGJ7YY6C8FVEW1TRHRK6VMKU4C95'];
  
  console.log('Kiểm tra các BSCSCAN API key mới:');
  let allSuccess = true;
  
  for (const key of newKeys) {
    console.log(`\nKiểm tra BSCSCAN API key mới: ${key}`);
    const result = await testBscscanKey(key);
    if (!result) allSuccess = false;
  }
  
  // Kiểm tra một API key thông qua hệ thống rotation
  const apiKey = getApiKey('BSC', 'BSCScan');
  console.log(`\nKiểm tra BSCSCAN API key từ rotation: ${apiKey}`);
  const rotationResult = await testBscscanKey(apiKey);
  
  return allSuccess && rotationResult;
}

// Kiểm tra tất cả các key mới
async function testAllNewKeys() {
  console.log('Bắt đầu kiểm tra các API key mới...');
  
  console.log('\n===== KIỂM TRA BITCOIN TATUM API KEY =====');
  const btcResult = await testBTCTatumKey();
  
  console.log('\n===== KIỂM TRA ETHEREUM ETHERSCAN API KEY =====');
  const ethResult = await testETHKey();
  
  console.log('\n===== KIỂM TRA BSC BSCSCAN API KEY =====');
  const bscResult = await testBSCKey();
  
  console.log('\n===== KẾT QUẢ KIỂM TRA =====');
  console.log(`Bitcoin Tatum API Key: ${btcResult ? '✅ HOẠT ĐỘNG TỐT' : '❌ KHÔNG HOẠT ĐỘNG'}`);
  console.log(`Ethereum Etherscan API Key: ${ethResult ? '✅ HOẠT ĐỘNG TỐT' : '❌ KHÔNG HOẠT ĐỘNG'}`);
  console.log(`BSC BSCScan API Key: ${bscResult ? '✅ HOẠT ĐỘNG TỐT' : '❌ KHÔNG HOẠT ĐỘNG'}`);
}

// Chạy kiểm tra
testAllNewKeys().catch(error => {
  console.error('Lỗi kiểm tra API keys:', error);
});