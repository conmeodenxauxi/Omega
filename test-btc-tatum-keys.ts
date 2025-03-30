import fetch from 'node-fetch';

// Danh sách API key Tatum cho BTC cần kiểm tra
const tatumBTCKeys = [
  't-67e888a2832893ddeb2bfbce-5c2156d4a3274787897d1e33',
  't-67e88a6d5953fae328c284f9-5c1d92b1ccd74b1b88dee74a',
  't-67e88dad5953fae328c28507-cace0aa2db32403e979b03b6',
  't-67e891c09c386072971b6f58-de256a0565b049ce8d537e8e',
  't-67e892fb5953fae328c2850f-a7b5e0f5c750419fbe1b83c2',
  't-67e8951d5953fae328c28518-72cb0d0d1c534f0aa91cea65',
  't-67e896559c386072971b6f63-8090b6da562348cfb25aba8e',
  't-67e8975d9c386072971b6f6a-c4763690c181424d9daebb14',
  't-67e898829c386072971b6f73-569069b90c4843da859a4b9e',
  't-67e8994f832893ddeb2bfbe0-245ad020ff9b445381cac588'
];

// Hàm kiểm tra API key Tatum cho BTC
async function testTatumBTCKey(apiKey: string, index: number) {
  try {
    console.log(`\nKiểm tra API key BTC #${index + 1}: ${apiKey.substring(0, 15)}...`);
    
    const url = 'https://bitcoin-mainnet.gateway.tatum.io/';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        "jsonrpc": "2.0",
        "method": "getblockcount",
        "id": 1
      })
    };
    
    const startTime = Date.now();
    const response = await fetch(url, options);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API key BTC #${index + 1} còn hợp lệ! (${responseTime}ms)`);
      console.log(`Kết quả:`, JSON.stringify(data).substring(0, 100));
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ API key BTC #${index + 1} đã hết hạn - HTTP ${response.status} (${responseTime}ms)`);
      console.log(`Lỗi: ${errorText.substring(0, 100)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Lỗi khi kiểm tra API key BTC #${index + 1}: ${error}`);
    return false;
  }
}

// Kiểm tra các API key theo batch để tránh rate limit
async function testBatchBTC(keys: string[], startIndex: number) {
  const results = [];
  const batchSize = 3; // Kiểm tra 3 key cùng lúc
  
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);
    console.log(`\nĐang kiểm tra batch ${i/batchSize + 1} (${batch.length} keys)...`);
    
    const batchResults = await Promise.all(
      batch.map((key, idx) => testTatumBTCKey(key, startIndex + i + idx))
    );
    
    results.push(...batchResults);
    
    // Đợi 2 giây trước khi kiểm tra batch tiếp theo
    if (i + batchSize < keys.length) {
      console.log('Đợi 2 giây để tránh rate limit...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}

// Kiểm tra tất cả API key BTC
async function testAllBTCKeys() {
  console.log('=== Kiểm tra tất cả API key Tatum cho BTC ===');
  console.log(`Tổng số: ${tatumBTCKeys.length} keys`);
  console.log(`Thời gian: ${new Date().toLocaleString()}`);
  
  const results = await testBatchBTC(tatumBTCKeys, 0);
  
  // Tổng kết
  const validCount = results.filter(Boolean).length;
  console.log(`\n=== Kết quả: ${validCount}/${tatumBTCKeys.length} key còn hợp lệ ===`);
  
  return validCount === tatumBTCKeys.length;
}

// Chạy kiểm tra
testAllBTCKeys()
  .then(allValid => {
    if (allValid) {
      console.log('✅ Tất cả API key Tatum cho BTC đều hoạt động tốt.');
      console.log('📝 Bạn có thể thêm chúng vào api-keys.ts');
    } else {
      console.log('⚠️ Một số API key không hoạt động. Kiểm tra lại trước khi thêm vào hệ thống.');
    }
  })
  .catch(console.error);