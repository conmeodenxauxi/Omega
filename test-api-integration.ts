/**
 * Script kiểm tra tích hợp API key mới trong hệ thống xoay vòng
 */

import { BlockchainType } from './shared/schema';
import { checkBalancesInParallel } from './server/blockchain/parallel-balance-checker';

/**
 * Kiểm tra tích hợp các key mới trong ứng dụng
 */
async function testApiIntegration() {
  console.log("=".repeat(80));
  console.log("KIỂM TRA TÍCH HỢP API KEY MỚI TRONG HỆ THỐNG XOAY VÒNG");
  console.log("=".repeat(80));
  
  // Tạo danh sách địa chỉ test
  const testAddresses: Array<{ blockchain: BlockchainType; address: string }> = [
    // SOL - Kiểm tra Helius API key mới
    { blockchain: "SOL", address: "9WzDXwBbmkg8ZTbMqNFC6H7mS8nvJQvBmDSJgKGhWpgY" }, // SOL address
    { blockchain: "SOL", address: "DsVPH4tJQpj9T1HUmkRWQQe74hXj6aJ8sjYmCVfB3S3F" }, // SOL address 2
    
    // BTC - Kiểm tra Tatum API key mới
    { blockchain: "BTC", address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" }, // Genesis address
    { blockchain: "BTC", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" }, // Ví có số dư
  ];
  
  try {
    console.log(`Kiểm tra ${testAddresses.length} địa chỉ với cơ chế xoay vòng...`);
    const startTime = Date.now();
    
    const results = await checkBalancesInParallel(testAddresses);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`\nKết quả kiểm tra (${results.length} kết quả, thời gian: ${duration}ms):`);
    results.forEach(result => {
      console.log(`${result.blockchain}: ${result.address} - Số dư: ${result.balance} (${result.hasBalance ? 'CÓ SỐ DƯ' : 'Không có số dư'})`);
    });
    
    // Tổng hợp kết quả
    const withBalance = results.filter(r => r.hasBalance).length;
    console.log(`\nTìm thấy ${withBalance}/${results.length} địa chỉ có số dư`);
    
    // Kiểm tra từng blockchain
    const solResults = results.filter(r => r.blockchain === 'SOL');
    const btcResults = results.filter(r => r.blockchain === 'BTC');
    
    console.log("\nKiểm tra kết quả theo blockchain:");
    console.log(`- SOL: ${solResults.filter(r => r.hasBalance).length}/${solResults.length} địa chỉ có số dư`);
    console.log(`- BTC: ${btcResults.filter(r => r.hasBalance).length}/${btcResults.length} địa chỉ có số dư`);
    
    return results;
  } catch (error) {
    console.error("Lỗi khi kiểm tra tích hợp API:", error);
    throw error;
  }
}

// Chạy kiểm tra
testApiIntegration().catch(console.error);