/**
 * Script kiểm tra cơ chế kiểm tra số dư song song
 * Cho phép kiểm tra đồng thời số dư trên nhiều blockchain
 */

import { BlockchainType, BalanceCheckResult } from '@shared/schema';
import { checkBalancesInParallel, checkBalancesByBlockchain } from './server/blockchain/parallel-balance-checker';

/**
 * Chạy test kiểm tra song song nhiều địa chỉ
 */
async function testParallelChecking() {
  console.log("Bắt đầu kiểm tra hiệu suất song song...");
  
  const startTime = Date.now();
  
  // Tạo danh sách địa chỉ test
  const testAddresses: Array<{ blockchain: BlockchainType; address: string }> = [
    // BTC
    { blockchain: "BTC", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" }, // Ví có số dư
    { blockchain: "BTC", address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" }, // Genesis address
    
    // ETH
    { blockchain: "ETH", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" }, // Vitalik
    { blockchain: "ETH", address: "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5" }, // Ví ERC-20
    
    // BSC
    { blockchain: "BSC", address: "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3" }, // BNB
    { blockchain: "BSC", address: "0xF977814e90dA44bFA03b6295A0616a897441aceC" }, // Binance hot wallet
    
    // SOL
    { blockchain: "SOL", address: "9WzDXwBbmkg8ZTbMqNFC6H7mS8nvJQvBmDSJgKGhWpgY" }, // SOL address
    { blockchain: "SOL", address: "DsVPH4tJQpj9T1HUmkRWQQe74hXj6aJ8sjYmCVfB3S3F" }, // SOL address 2
    
    // DOGE
    { blockchain: "DOGE", address: "D8mQ4xQKpCW7NvNrhCu9qEZjXk4KBj7trA" }, // Dogecoin address
    { blockchain: "DOGE", address: "DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L" }, // DOGE address 2
  ];
  
  try {
    console.log(`Kiểm tra ${testAddresses.length} địa chỉ song song...`);
    const results = await checkBalancesInParallel(testAddresses);
    
    console.log(`\nKết quả kiểm tra (${results.length} kết quả):`);
    results.forEach(result => {
      console.log(`${result.blockchain}: ${result.address} - Số dư: ${result.balance} (${result.hasBalance ? 'CÓ SỐ DƯ' : 'Không có số dư'})`);
    });
    
    // Tổng hợp kết quả
    const withBalance = results.filter(r => r.hasBalance).length;
    console.log(`\nTìm thấy ${withBalance}/${results.length} địa chỉ có số dư`);
  } catch (error) {
    console.error("Lỗi khi kiểm tra song song:", error);
  }
  
  const endTime = Date.now();
  console.log(`\nThời gian thực hiện: ${endTime - startTime}ms\n`);
}

/**
 * Chạy test kiểm tra song song theo nhóm blockchain
 */
async function testGroupedChecking() {
  console.log("Bắt đầu kiểm tra hiệu suất song song theo nhóm...");
  
  const startTime = Date.now();
  
  // Tạo danh sách nhóm địa chỉ test
  const addressGroups: Record<BlockchainType, string[]> = {
    BTC: [
      "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
    ],
    ETH: [
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5"
    ],
    BSC: [
      "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3",
      "0xF977814e90dA44bFA03b6295A0616a897441aceC"
    ],
    SOL: [
      "9WzDXwBbmkg8ZTbMqNFC6H7mS8nvJQvBmDSJgKGhWpgY",
      "DsVPH4tJQpj9T1HUmkRWQQe74hXj6aJ8sjYmCVfB3S3F"
    ],
    DOGE: [
      "D8mQ4xQKpCW7NvNrhCu9qEZjXk4KBj7trA",
      "DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L"
    ]
  };
  
  try {
    console.log("Kiểm tra địa chỉ song song theo nhóm blockchain...");
    const resultsByBlockchain = await checkBalancesByBlockchain(addressGroups);
    
    console.log("\nKết quả kiểm tra theo blockchain:");
    let totalWithBalance = 0;
    let totalChecked = 0;
    
    Object.entries(resultsByBlockchain).forEach(([blockchain, results]) => {
      const withBalance = results.filter(r => r.hasBalance).length;
      totalWithBalance += withBalance;
      totalChecked += results.length;
      
      console.log(`${blockchain}: ${withBalance}/${results.length} địa chỉ có số dư`);
      results.forEach(result => {
        console.log(`  - ${result.address}: ${result.balance} (${result.hasBalance ? 'CÓ SỐ DƯ' : 'Không có số dư'})`);
      });
    });
    
    console.log(`\nTổng: ${totalWithBalance}/${totalChecked} địa chỉ có số dư`);
  } catch (error) {
    console.error("Lỗi khi kiểm tra song song theo nhóm:", error);
  }
  
  const endTime = Date.now();
  console.log(`\nThời gian thực hiện: ${endTime - startTime}ms\n`);
}

/**
 * Chạy tất cả các test
 */
async function runAllTests() {
  console.log("=".repeat(80));
  console.log("KIỂM TRA CHỨC NĂNG SONG SONG");
  console.log("=".repeat(80));
  
  await testParallelChecking();
  
  console.log("\n" + "=".repeat(80));
  console.log("KIỂM TRA CHỨC NĂNG SONG SONG THEO NHÓM");
  console.log("=".repeat(80));
  
  await testGroupedChecking();
}

// Chạy các test
runAllTests().catch(console.error);