import fetch from 'node-fetch';

// Địa chỉ thử nghiệm Dogecoin có số dư
const testAddress = 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L';

// Danh sách API key Tatum để kiểm tra
const tatumKeys = [
  't-67e87aff5953fae328c284a2-00409cd135ad4247badffb32',
  't-67e879369c386072971b6f11-2570f79dc58f410bacdfcfd6',
  't-67e87c459c386072971b6f1b-8177400282744943842bc637',
  't-67e87ceb832893ddeb2bfb85-f0e675bd2a5e4d729fa02052',
  't-67e87d41832893ddeb2bfb8d-87242e2dff6a4a9aa4864197',
  't-67e87def5953fae328c284ae-a0f9aced6e134936a9ea1f33',
  't-67e87ed25953fae328c284be-eb439fa5f5724331a5142880',
  't-67e87eb79c386072971b6f25-48419e24b4a1446a8877e9b2',
  't-67e87f8b832893ddeb2bfb99-afff5832b65d431aa8ded26c',
  't-67e87fad9c386072971b6f33-5a969661d2e340e992459d9f',
];

// Hàm kiểm tra API key
async function testTatumKey(apiKey: string, index: number) {
  try {
    console.log(`\nKiểm tra API key #${index + 1}: ${apiKey.substring(0, 15)}...`);
    
    const url = `https://api.tatum.io/v3/dogecoin/address/balance/${testAddress}`;
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    };
    
    const startTime = Date.now();
    const response = await fetch(url, options);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API key #${index + 1} còn hợp lệ! (${responseTime}ms)`);
      console.log(`Số dư: ${data.incoming}`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ API key #${index + 1} đã hết hạn - HTTP ${response.status} (${responseTime}ms)`);
      console.log(`Lỗi: ${errorText.substring(0, 100)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Lỗi khi kiểm tra API key #${index + 1}: ${error}`);
    return false;
  }
}

// Kiểm tra từng batch API key để tránh rate limit
async function testBatch(keys: string[], startIndex: number) {
  const results = [];
  const batchSize = 3; // Kiểm tra 3 key cùng lúc
  
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);
    console.log(`\nĐang kiểm tra batch ${i/batchSize + 1} (${batch.length} keys)...`);
    
    const batchResults = await Promise.all(
      batch.map((key, idx) => testTatumKey(key, startIndex + i + idx))
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

// Kiểm tra tất cả key
async function testAllKeys() {
  console.log('=== Kiểm tra tất cả API key Tatum ===');
  console.log(`Tổng số: ${tatumKeys.length} keys`);
  console.log(`Thời gian: ${new Date().toLocaleString()}`);
  
  const results = await testBatch(tatumKeys, 0);
  
  // Tổng kết
  const validCount = results.filter(Boolean).length;
  console.log(`\n=== Kết quả: ${validCount}/${tatumKeys.length} key còn hợp lệ ===`);
}

// Chạy kiểm tra
testAllKeys()
  .then(() => console.log('Đã hoàn thành kiểm tra API key'))
  .catch(console.error);