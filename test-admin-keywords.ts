/**
 * Script kiểm tra các từ khóa admin
 */

import fetch from 'node-fetch';

interface ApiResponse {
  wallets?: Array<any>;
  message?: string;
}

async function testAdminKeywords() {
  console.log("Bắt đầu kiểm tra các từ khóa admin...");
  
  // URL API với mã thông báo URL từ api tới server
  const apiUrl = process.env.REPLIT_URL || "https://advanced-wallet-finder.coderdreamer.repl.co";
  
  // Danh sách từ khóa cần kiểm tra
  const adminKeywords = [
    "BlackCat",
    "Blackcat",
    "blackcat", 
    "BackCat",
    "BlackCat ",  // Có dấu cách ở cuối
    "Blackcat ",  // Có dấu cách ở cuối
    "blackcat "   // Có dấu cách ở cuối
  ];
  
  // Tạo bảng hiển thị kết quả
  console.log("| Từ khóa admin | Kết quả |");
  console.log("|--------------|---------|");
  
  for (const keyword of adminKeywords) {
    try {
      // Thử gọi API query wallets với từng từ khóa
      const response = await fetch(`${apiUrl}/api/admin/query-wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: keyword
        }),
      });
      
      const result = await response.json() as ApiResponse;
      
      // Hiển thị kết quả
      if (response.status === 200) {
        console.log(`| "${keyword}" | ✅ Thành công | ${result.wallets ? result.wallets.length : 0} wallets`);
      } else {
        console.log(`| "${keyword}" | ❌ Thất bại | ${result.message || 'Lỗi không xác định'}`);
      }
    } catch (error: any) {
      console.log(`| "${keyword}" | ❌ Lỗi | ${error.message || 'Lỗi không xác định'}`);
    }
  }
  
  console.log("\nHoàn tất kiểm tra các từ khóa admin.");
}

// Chạy kiểm tra
testAdminKeywords().catch(console.error);