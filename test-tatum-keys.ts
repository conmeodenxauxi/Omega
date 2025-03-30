import fetch from 'node-fetch';

// Kiểm tra các API key cuối cùng (16-20)
const tatumKeys = [
  't-67e88227832893ddeb2bfba8-aa301b8f7c554271a8eebc10',
  't-67e88349832893ddeb2bfbb4-1946d051f1084b5ebcbf6927',
  't-67e883175953fae328c284e9-464883db18be4955a60a683f',
  't-67e88422832893ddeb2bfbbd-c890492b88b0459fbc51bf16',
  't-67e884e8832893ddeb2bfbc6-3c30b4a88f4b4d00b57a327b'
];

// Địa chỉ Dogecoin test để kiểm tra - có thể dùng địa chỉ của một ví Dogecoin có sẵn
const testAddress = 'DBs4WcRE7eysKwRxHNX88XZVCQ9M6QSUSz'; // Địa chỉ Dogecoin có thể dùng để test

// Hàm kiểm tra từng API key
async function testTatumKey(apiKey: string, index: number) {
  try {
    console.log(`\nKiểm tra API key [${index + 1}/5]: ${apiKey.substring(0, 10)}...`);
    
    const url = `https://api.tatum.io/v3/dogecoin/address/balance/${testAddress}`;
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      timeout: 5000 // 5 giây timeout
    };
    
    // Sử dụng Promise.race để thêm timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout after 5s')), 5000)
    );
    
    const fetchPromise = fetch(url, options);
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    const data = await response.json();
    
    if (response.status === 200) {
      console.log(`✅ Key hoạt động! Status: ${response.status} ${response.statusText}`);
      console.log(`⟳ Thông tin phản hồi:`, JSON.stringify(data, null, 2));
      return { success: true, key: apiKey, data };
    } else {
      console.log(`❌ Lỗi! Status: ${response.status} ${response.statusText}`);
      console.log(`⚠️ Lỗi:`, JSON.stringify(data, null, 2));
      return { success: false, key: apiKey, error: data };
    }
  } catch (error) {
    console.log(`❌ Lỗi khi gọi API: ${error.message}`);
    return { success: false, key: apiKey, error: error.message };
  }
}

// Hàm kiểm tra một nhóm API key
async function testBatch(keys: string[], startIndex: number) {
  const results = {
    success: [] as string[],
    failed: [] as string[]
  };
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const result = await testTatumKey(key, startIndex + i);
      
      if (result.success) {
        results.success.push(key);
      } else {
        results.failed.push(key);
      }
      
      // Delay giữa các request để tránh rate limit
      if (i < keys.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (err) {
      console.log(`❌ Lỗi với key ${key}: ${err.message}`);
      results.failed.push(key);
    }
  }
  
  return results;
}

// Hàm kiểm tra tất cả các key
async function testAllKeys() {
  console.log(`Bắt đầu kiểm tra ${tatumKeys.length} API key Tatum cho Dogecoin...`);
  
  // Chia thành các nhóm, mỗi nhóm 5 key
  const batchSize = 5;
  const totalResults = {
    success: [] as string[],
    failed: [] as string[]
  };
  
  for (let i = 0; i < tatumKeys.length; i += batchSize) {
    console.log(`\n----- Kiểm tra batch ${i/batchSize + 1}/${Math.ceil(tatumKeys.length/batchSize)} -----`);
    const batch = tatumKeys.slice(i, i + batchSize);
    const results = await testBatch(batch, i);
    
    totalResults.success.push(...results.success);
    totalResults.failed.push(...results.failed);
    
    // Delay giữa các nhóm
    if (i + batchSize < tatumKeys.length) {
      console.log("\nĐợi 3 giây trước khi kiểm tra nhóm tiếp theo...");
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Hiển thị kết quả tổng hợp
  console.log('\n===== KẾT QUẢ KIỂM TRA =====');
  console.log(`✅ ${totalResults.success.length}/${tatumKeys.length} key hoạt động tốt`);
  
  if (totalResults.failed.length > 0) {
    console.log(`❌ ${totalResults.failed.length}/${tatumKeys.length} key không hoạt động:`);
    totalResults.failed.forEach((key, index) => {
      console.log(`   ${index + 1}. ${key}`);
    });
  } else {
    console.log('✨ Tất cả API key đều hoạt động tốt!');
  }
}

// Chạy kiểm tra
testAllKeys().catch(error => {
  console.error('Lỗi trong quá trình kiểm tra:', error);
});