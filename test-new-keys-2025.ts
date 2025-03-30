/**
 * Script kiểm tra API key mới đã thêm vào hệ thống (2025)
 */

import fetch from 'node-fetch';
import { BlockchainType } from './shared/schema';

/**
 * Kiểm tra key Helius mới cho Solana
 */
async function testHeliusKey(apiKey: string) {
  console.log("Kiểm tra key Helius mới:", apiKey);
  
  // Địa chỉ ví Solana nổi tiếng (Vitalik Buterin's Solana address)
  const address = 'DsVPH4tJQpj9T1HUmkRWQQe74hXj6aJ8sjYmCVfB3S3F';
  
  const url = `https://api.helius.xyz/v0/addresses/${address}/balances?api-key=${apiKey}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log("Kết quả từ API Helius:", JSON.stringify(data, null, 2));
    
    if (data.tokens || data.nativeBalance) {
      console.log("✅ API Helius hoạt động tốt!");
      return true;
    } else {
      console.log("❌ API Helius không trả về dữ liệu số dư!");
      return false;
    }
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra API Helius:", error);
    return false;
  }
}

/**
 * Kiểm tra key Tatum mới cho Bitcoin
 */
async function testTatumBTCKey(apiKey: string) {
  console.log("Kiểm tra key Tatum mới cho BTC:", apiKey);
  
  // Địa chỉ ví Bitcoin nổi tiếng (Satoshi's address)
  const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
  
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
    console.log("Kết quả từ API Tatum:", JSON.stringify(data, null, 2));
    
    if (data.incoming || data.outgoing) {
      console.log("✅ API Tatum BTC hoạt động tốt!");
      return true;
    } else if (data.statusCode && data.statusCode >= 400) {
      console.log("❌ API Tatum BTC bị lỗi:", data.message || "Không xác định");
      return false;
    } else {
      console.log("⚠️ API Tatum BTC trả về dữ liệu không xác định");
      return false;
    }
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra API Tatum BTC:", error);
    return false;
  }
}

/**
 * Chạy kiểm tra tất cả key mới
 */
async function testAllNewKeys() {
  console.log("=".repeat(80));
  console.log("KIỂM TRA CÁC API KEY MỚI (2025)");
  console.log("=".repeat(80));
  
  // Các API key mới
  const heliusKey = 'f769413c-ebdf-4df9-841a-aa054fbce6b2';
  const tatumBTCKey = 't-67e8b19d5953fae328c2853a-6c3e0ea944094a47b3ef59f4';
  
  console.log("\n1. Kiểm tra key Helius cho Solana");
  console.log("-".repeat(50));
  const heliusResult = await testHeliusKey(heliusKey);
  
  console.log("\n2. Kiểm tra key Tatum cho BTC");
  console.log("-".repeat(50));
  const tatumBTCResult = await testTatumBTCKey(tatumBTCKey);
  
  console.log("\n=".repeat(80));
  console.log("KẾT QUẢ TỔNG QUAN");
  console.log("=".repeat(80));
  console.log(`Helius Solana: ${heliusResult ? '✅ Hoạt động' : '❌ Lỗi'}`);
  console.log(`Tatum BTC: ${tatumBTCResult ? '✅ Hoạt động' : '❌ Lỗi'}`);
  console.log("=".repeat(80));
}

// Chạy kiểm tra
testAllNewKeys().catch(console.error);