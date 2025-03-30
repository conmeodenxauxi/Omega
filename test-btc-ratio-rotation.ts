/**
 * Script kiểm tra cơ chế xoay vòng thông minh cho Bitcoin với tỷ lệ 1:3
 * Mỗi API key (bao gồm cả RPC miễn phí) được tính là một slot riêng biệt
 */

import { getNextBitcoinEndpoint } from './server/blockchain/api-smart-rotation-btc';

/**
 * Kiểm tra tỷ lệ 1:3 giữa BlockCypher và các API khác
 */
function testBitcoinRatio() {
  console.log("Kiểm tra cơ chế xoay vòng Bitcoin với tỷ lệ 1:3 (BlockCypher:Các API khác)");
  console.log("Trước mỗi 3 lượt gọi API khác, sẽ có 1 lượt gọi BlockCypher");
  console.log("Giả lập 40 lần gọi API...\n");
  
  // Số lượng lần gọi
  const callCount = 40;
  
  // Đếm số lần gọi mỗi loại API
  const apiCallCounts: Record<string, number> = {};
  let blockCypherCount = 0;
  let otherCount = 0;
  
  // Giả lập callCount lần gọi API
  for (let i = 0; i < callCount; i++) {
    const apiName = getNextBitcoinEndpoint();
    
    // Đếm số lần gọi mỗi API
    apiCallCounts[apiName] = (apiCallCounts[apiName] || 0) + 1;
    
    // Đếm riêng BlockCypher và các API khác
    if (apiName === 'BlockCypher') {
      blockCypherCount++;
    } else {
      otherCount++;
    }
    
    console.log(`Lần gọi #${i+1}: ${apiName}`);
  }
  
  // Hiển thị kết quả
  console.log("\n=== KẾT QUẢ ===");
  console.log(`Tổng số lần gọi API: ${callCount}`);
  console.log(`Số lần gọi BlockCypher: ${blockCypherCount} (${(blockCypherCount / callCount * 100).toFixed(1)}%)`);
  console.log(`Số lần gọi API khác: ${otherCount} (${(otherCount / callCount * 100).toFixed(1)}%)`);
  console.log(`Tỷ lệ BlockCypher:Các API khác = 1:${(otherCount / blockCypherCount).toFixed(1)}`);
  
  console.log("\nThống kê chi tiết:");
  Object.entries(apiCallCounts).forEach(([apiName, count]) => {
    console.log(`- ${apiName}: ${count} lần (${(count / callCount * 100).toFixed(1)}%)`);
  });
  
  // Kiểm tra tỷ lệ
  const ratio = otherCount / blockCypherCount;
  console.log(`\nKết quả kiểm tra tỷ lệ 1:3: ${ratio >= 2.5 && ratio <= 3.5 ? 'THÀNH CÔNG ✅' : 'THẤT BẠI ❌'}`);
  console.log(`Tỷ lệ thực tế: 1:${ratio.toFixed(1)}`);
  
  // Kiểm tra mẫu xoay vòng chính xác
  console.log("\nKiểm tra mẫu xoay vòng:");
  let correctPositions = 0;
  let totalPositions = 0;
  
  // Vị trí mà BlockCypher nên xuất hiện (mỗi 4 lần gọi)
  const expectedBlockCypherPositions = [];
  for (let i = 4; i <= callCount; i += 4) {
    expectedBlockCypherPositions.push(i);
  }
  
  // Vị trí thực tế nơi BlockCypher xuất hiện
  const actualBlockCypherPositions = [];
  
  // Lặp lại quá trình gọi API để kiểm tra vị trí
  let apiCallCounter = 0;
  for (let i = 0; i < callCount; i++) {
    const apiName = getNextBitcoinEndpoint();
    apiCallCounter++;
    
    if (apiName === 'BlockCypher') {
      actualBlockCypherPositions.push(apiCallCounter);
    }
  }
  
  console.log(`Vị trí kỳ vọng cho BlockCypher: [${expectedBlockCypherPositions.join(', ')}]`);
  console.log(`Vị trí thực tế của BlockCypher: [${actualBlockCypherPositions.join(', ')}]`);
  
  // So sánh vị trí kỳ vọng và thực tế
  const positionsMatch = expectedBlockCypherPositions.length === actualBlockCypherPositions.length &&
    expectedBlockCypherPositions.every((val, index) => val === actualBlockCypherPositions[index]);
  
  console.log(`Mẫu xoay vòng: ${positionsMatch ? 'CHÍNH XÁC ✅' : 'KHÔNG CHÍNH XÁC ❌'}`);
  console.log("(BlockCypher nên xuất hiện ở vị trí 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, ...)");
}

// Chạy kiểm tra
testBitcoinRatio();