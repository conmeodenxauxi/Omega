import { prepareApiRequest, getNextEndpoint, getApiKey } from './server/blockchain/api-keys';
import { BlockchainType } from './shared/schema';

// Địa chỉ Solana hợp lệ để kiểm tra
const solanaAddress = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';

async function testRotation(blockchain: BlockchainType, count: number) {
  console.log(`\n=== Kiểm tra xoay vòng API cho ${blockchain} (${count} lần) ===\n`);
  
  const stats: Record<string, number> = {};
  
  for (let i = 0; i < count; i++) {
    // Lấy endpoint tiếp theo
    const endpoint = getNextEndpoint(blockchain);
    const name = endpoint.name;
    
    // Tăng số lần xuất hiện trong stats
    stats[name] = (stats[name] || 0) + 1;
    
    // Lấy API key nếu cần
    let apiKeyInfo = '';
    if (endpoint.needsApiKey) {
      const apiKey = getApiKey(blockchain, name);
      apiKeyInfo = ` với API key: ${apiKey.substring(0, 8)}...`;
    }
    
    console.log(`#${i+1}: Đã chọn ${name}${apiKeyInfo} (đã gọi ${endpoint.callCount} lần)`);
  }
  
  console.log('\n=== Thống kê ===');
  Object.entries(stats).forEach(([name, count]) => {
    console.log(`${name}: ${count} lần (${(count/count * 100).toFixed(1)}%)`);
  });
}

// Kiểm tra xoay vòng cho Solana
// Cần chạy 30-40 lần để thấy hết chu kỳ (1 API public + 20 API key private)
// Kết quả mong đợi sẽ xoay vòng Solana RPC (public) và Helius (private) một cách cân bằng
const testCount = 40;

// Chạy kiểm tra
testRotation('SOL', testCount)
  .then(() => console.log('Hoàn thành kiểm tra'))
  .catch(console.error);