import fetch from 'node-fetch';
import { BlockchainType } from './shared/schema';
import { getApiConfigs } from './server/blockchain/api-keys';

// Địa chỉ thử nghiệm có số dư cho mỗi blockchain (để kiểm tra API)
const testAddresses = {
  BTC: '1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ', // Địa chỉ ví BTC có số dư
  ETH: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Vitalik Buterin
  BSC: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', // BNB Token Contract
  SOL: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Địa chỉ SOL với số dư
  DOGE: 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L' // Địa chỉ DOGE với số dư
};

async function testAPI(blockchain: BlockchainType, address: string) {
  console.log(`\n----- Kiểm tra API cho ${blockchain} -----`);
  
  // Lấy tất cả cấu hình API cho blockchain
  const configs = getApiConfigs(blockchain, address);
  
  for (const config of configs) {
    try {
      console.log(`\nThử ${config.name}...`);
      
      // Thực hiện request
      const fetchOptions: any = {
        method: config.method,
        headers: config.headers
      };
      
      if (config.method === 'POST' && config.body) {
        fetchOptions.body = config.body;
      }
      
      const startTime = Date.now();
      const response = await fetch(config.url, fetchOptions);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${config.name} hoạt động tốt! (${responseTime}ms)`);
        console.log('Kết quả:', JSON.stringify(data, null, 2).substring(0, 300) + '...');
      } else {
        console.log(`❌ ${config.name} thất bại - HTTP ${response.status} (${responseTime}ms)`);
        const errorText = await response.text();
        console.log('Response:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log(`❌ ${config.name} LỖI: ${error}`);
    }
  }
}

async function testAllBlockchains() {
  console.log('=== Kiểm tra tất cả API blockchain ===');
  console.log('Mỗi blockchain sẽ được kiểm tra với các API đã cấu hình');
  console.log('Thời gian thực hiện: ' + new Date().toLocaleString());
  
  for (const [blockchain, address] of Object.entries(testAddresses) as [BlockchainType, string][]) {
    await testAPI(blockchain as BlockchainType, address);
  }
  
  console.log('\n=== Kiểm tra hoàn tất ===');
}

// Chạy tất cả các kiểm tra
testAllBlockchains()
  .then(() => console.log('Đã hoàn thành tất cả kiểm tra'))
  .catch(console.error);