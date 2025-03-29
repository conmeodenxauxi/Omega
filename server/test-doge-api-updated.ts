/**
 * Script kiểm tra tất cả các API cho Dogecoin - Phiên bản cập nhật
 * Kiểm tra cả API keys và public endpoints
 */

import fetch from 'node-fetch';
import { BlockchainType } from '../shared/schema';
import { getAllApiConfigs } from './blockchain/api-keys';

// Địa chỉ ví Dogecoin có số dư
const TEST_ADDRESSES = [
  'DQkwDpRYUyNNnoEZDfSGFFeQvLgbdEXiRd', // Địa chỉ có số dư
  'DLkz3tX7CuVqLR5bMkBGxQmwn5aioHpaXE'  // Địa chỉ có số dư
];

// Địa chỉ ví Dogecoin không có số dư 
const EMPTY_ADDRESS = 'DFundmtrigzA6E4Rk9XHCrM4RYhHmaxmReD';

const TIMEOUT_MS = 10000; // 10 seconds timeout

function fetchWithTimeout(url: string, options: any, timeout = TIMEOUT_MS) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout)
    )
  ]) as Promise<Response>;
}

async function formatBalance(balance: string): Promise<string> {
  try {
    // Đối với Dogecoin, chuyển đổi từ số nguyên (satoshi) sang giá trị thực
    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum)) return '0';
    
    // Đối với Dogecoin, 1 DOGE = 100000000 satoshi
    return (balanceNum / 100000000).toFixed(8);
  } catch (e) {
    console.error('Lỗi khi định dạng số dư:', e);
    return '0';
  }
}

async function testApiEndpoint(config: any, testAddress: string): Promise<{
  success: boolean,
  balance?: string,
  error?: string,
  response?: any
}> {
  console.log(`\nKiểm tra endpoint ${config.name} với địa chỉ ${testAddress}`);
  console.log(`URL: ${config.url}`);
  
  try {
    const response = await fetchWithTimeout(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.body
    });
    
    if (!response.ok) {
      console.error(`❌ Lỗi HTTP: ${response.status} - ${response.statusText}`);
      return {
        success: false,
        error: `HTTP Error: ${response.status} ${response.statusText}`
      };
    }
    
    const data = await response.json();
    console.log('📝 Kết quả:', JSON.stringify(data, null, 2));
    
    // Phân tích kết quả theo từng loại API
    let balance = '0';
    
    switch (config.name) {
      case 'Blockchair':
        if (data.data && data.data[testAddress] && data.data[testAddress].address) {
          balance = data.data[testAddress].address.balance.toString();
        }
        break;
        
      case 'SoChain':
        if (data.data && data.data.confirmed_balance) {
          balance = data.data.confirmed_balance;
        }
        break;
        
      case 'DogeChain':
        if (data.balance) {
          balance = data.balance;
        }
        break;
        
      case 'BlockCypher DOGE':
      case 'BlockCypherDOGE':
        if (data.balance !== undefined) {
          balance = data.balance.toString();
        } else if (data.final_balance !== undefined) {
          balance = data.final_balance.toString();
        }
        break;
        
      case 'Chain.so':
        if (data.data && data.data.confirmed_balance) {
          balance = data.data.confirmed_balance;
        }
        break;
        
      case 'DOGE-RPC-1':
        if (data.data && data.data.length > 0 && data.data[0].balance !== undefined) {
          balance = data.data[0].balance.toString();
        }
        break;
        
      case 'DOGE-RPC-2':
        if (data.balance !== undefined) {
          balance = data.balance.toString();
        }
        break;
        
      case 'CryptoAPIs':
        if (data.data && data.data.item && data.data.item.confirmedBalance) {
          balance = data.data.item.confirmedBalance.amount;
        }
        break;
        
      case 'Nownodes':
        if (data.balance !== undefined) {
          balance = data.balance.toString();
        }
        break;
        
      default:
        console.warn(`⚠️ Không có bộ phân tích cho ${config.name}, sử dụng dữ liệu thô`);
        console.log('📄 Dữ liệu thô:', data);
    }
    
    // Định dạng số dư thành DOGE
    const formattedBalance = await formatBalance(balance);
    console.log(`💰 Số dư: ${formattedBalance} DOGE`);
    
    return {
      success: true,
      balance: formattedBalance,
      response: data
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Lỗi: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage
    };
  }
}

async function testAllApis() {
  console.log('🔍 Bắt đầu kiểm tra tất cả API cho Dogecoin');
  
  // Lấy tất cả cấu hình API cho Dogecoin
  const addressToTest = TEST_ADDRESSES[0]; // Sử dụng địa chỉ có số dư
  const apiConfigs = getAllApiConfigs('DOGE', addressToTest);
  
  console.log(`📋 Tìm thấy ${apiConfigs.length} endpoint để kiểm tra`);
  
  const results = [];
  
  // Kiểm tra từng API
  for (const config of apiConfigs) {
    const result = await testApiEndpoint(config, addressToTest);
    results.push({
      name: config.name,
      ...result
    });
  }
  
  // Hiển thị kết quả tổng hợp
  console.log('\n📊 Kết quả kiểm tra:');
  console.log('--------------------------------------------------');
  console.log('| Endpoint        | Trạng thái | Số dư           |');
  console.log('--------------------------------------------------');
  
  for (const result of results) {
    const status = result.success ? '✅ Thành công' : '❌ Lỗi';
    const balance = result.balance || 'N/A';
    console.log(`| ${result.name.padEnd(15)} | ${status.padEnd(11)} | ${balance.padEnd(15)} |`);
  }
  
  console.log('--------------------------------------------------');
  
  // Tóm tắt
  const successCount = results.filter(r => r.success).length;
  console.log(`\n✅ Thành công: ${successCount}/${results.length} endpoints`);
  
  // Kiểm tra API nào trả về số dư > 0
  const withBalanceCount = results.filter(r => r.success && r.balance && parseFloat(r.balance) > 0).length;
  console.log(`💰 Endpoints trả về số dư > 0: ${withBalanceCount}/${successCount}`);
}

// Kiểm tra một API cụ thể
async function testSingleApi(apiName: string) {
  console.log(`🔍 Kiểm tra API ${apiName} cho Dogecoin`);
  
  // Lấy tất cả cấu hình API cho Dogecoin
  const addressToTest = TEST_ADDRESSES[0]; // Sử dụng địa chỉ có số dư
  const apiConfigs = getAllApiConfigs('DOGE', addressToTest);
  
  // Tìm API theo tên
  const config = apiConfigs.find(c => c.name === apiName);
  
  if (!config) {
    console.error(`❌ Không tìm thấy API ${apiName}`);
    return;
  }
  
  // Kiểm tra API
  await testApiEndpoint(config, addressToTest);
  
  // Kiểm tra thêm với địa chỉ rỗng
  console.log('\n⚠️ Kiểm tra với địa chỉ không có số dư:');
  const emptyConfig = {
    ...config,
    url: config.url.replace(addressToTest, EMPTY_ADDRESS)
  };
  await testApiEndpoint(emptyConfig, EMPTY_ADDRESS);
}

// Hàm main
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Nếu có tham số, kiểm tra API cụ thể
    await testSingleApi(args[0]);
  } else {
    // Không có tham số, kiểm tra tất cả API
    await testAllApis();
  }
}

// Chạy hàm main
main().catch(error => {
  console.error('❌ Lỗi không mong muốn:', error);
  process.exit(1);
});