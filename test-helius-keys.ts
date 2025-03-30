/**
 * Script kiểm tra danh sách key Helius để xác định key nào còn hoạt động
 */
import fetch from 'node-fetch';

// Địa chỉ Solana mẫu để test
const TEST_ADDRESS = 'EedZkdJaUFFVj9vHFpjGTUF1XWcN5f37NGsXrynwcrSj';

// Danh sách API keys Helius từ mã nguồn - Chọn key cuối cùng chưa kiểm tra
const heliusApiKeys = [
  // 15 key đầu đã kiểm tra và không hợp lệ
  'e4a7ad23-a358-48e5-9830-576e6a7d3890',
  '38a6f01b-e32b-492c-9a96-29ad3d45b838',
  'cd2e7fad-15b4-4896-98d5-b9dccb6ca55e',
  '7b3a5e78-6ff3-402c-b390-7160f755d3d2',
  '1a8b6c2d-4f9e-40e3-967a-91d2c8f5b0a7'
];

// Thêm key từ biến môi trường nếu có và khác với các key đã có
const envKey = process.env.HELIUS_API_KEY;
if (envKey && !heliusApiKeys.includes(envKey)) {
  heliusApiKeys.push(envKey);
  console.log(`Đã thêm HELIUS_API_KEY từ biến môi trường: ${envKey.substring(0, 6)}...`);
}

/**
 * Kiểm tra API key Helius
 * @param apiKey API key cần kiểm tra
 * @param address Địa chỉ Solana
 * @returns Kết quả kiểm tra
 */
async function testHeliusKey(apiKey: string, address: string): Promise<{
  apiKey: string;
  isValid: boolean;
  error?: string;
  balance?: string;
}> {
  try {
    const response = await fetch('https://mainnet.helius-rpc.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address]
      })
    });

    const data = await response.json();
    
    // Kiểm tra lỗi API key
    if (data.error && data.error.code === -32401) {
      return {
        apiKey,
        isValid: false,
        error: 'API key không hợp lệ'
      };
    }
    
    // Kiểm tra lỗi khác
    if (data.error) {
      return {
        apiKey,
        isValid: false,
        error: `Lỗi: ${JSON.stringify(data.error)}`
      };
    }
    
    // Lấy số dư nếu có
    if (data.result && data.result.value !== undefined) {
      const balanceInLamports = data.result.value;
      const balanceInSOL = (balanceInLamports / 1e9).toFixed(9);
      
      return {
        apiKey,
        isValid: true,
        balance: balanceInSOL
      };
    }
    
    return {
      apiKey,
      isValid: true,
      error: 'Định dạng phản hồi không đúng'
    };
    
  } catch (error) {
    return {
      apiKey,
      isValid: false,
      error: `Lỗi kết nối: ${error instanceof Error ? error.message : 'Không xác định'}`
    };
  }
}

/**
 * Kiểm tra tất cả API keys
 */
async function testAllHeliusKeys() {
  console.log(`⏳ Bắt đầu kiểm tra ${heliusApiKeys.length} Helius API keys...`);
  
  const results = [];
  let validKeysCount = 0;
  
  for (let i = 0; i < heliusApiKeys.length; i++) {
    const apiKey = heliusApiKeys[i];
    const result = await testHeliusKey(apiKey, TEST_ADDRESS);
    
    // Hiển thị kết quả
    if (result.isValid) {
      console.log(`✅ Key #${i+1}: ${apiKey.substring(0, 10)}... hợp lệ${result.balance ? ` (Số dư: ${result.balance} SOL)` : ''}`);
      validKeysCount++;
    } else {
      console.log(`❌ Key #${i+1}: ${apiKey.substring(0, 10)}... không hợp lệ (${result.error})`);
    }
    
    results.push(result);
    
    // Chờ 500ms giữa mỗi request để tránh rate limit
    if (i < heliusApiKeys.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Hiển thị tổng kết
  console.log(`\n📊 Tổng kết: ${validKeysCount}/${heliusApiKeys.length} keys hợp lệ`);
  
  // Liệt kê các key hợp lệ
  if (validKeysCount > 0) {
    console.log('\n📝 Danh sách key hợp lệ:');
    results.forEach((result, index) => {
      if (result.isValid) {
        console.log(`- '${heliusApiKeys[index]}'`);
      }
    });
    
    // Đề xuất sửa mã nguồn
    console.log('\n💡 Gợi ý: Cập nhật mảng SOL_HELIUS trong server/blockchain/api-keys.ts với các key hợp lệ trên');
  } else {
    console.log('\n⚠️ Không tìm thấy key hợp lệ nào. Hãy tạo key mới trên trang Helius.xyz');
  }
}

// Chạy kiểm tra
testAllHeliusKeys().catch(error => {
  console.error('Lỗi:', error);
});