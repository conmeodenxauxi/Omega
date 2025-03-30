import fetch from 'node-fetch';
import { checkBalanceWithSmartRotation } from './server/blockchain/api-smart-rotation';
import { BlockchainType } from './shared/schema';

// Địa chỉ nổi tiếng cho mỗi blockchain
const FAMOUS_ADDRESSES = {
  // Satoshi (một trong những ví đầu tiên được biết đến)
  'BTC': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  // Ví của Vitalik Buterin (Ethereum)
  'ETH': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  // Ví Binance Hot Wallet
  'BSC': '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3',
  // Ví của Solana Foundation
  'SOL': '3EkHyEx8LXVGZ7Nb2MgYs9MJ6jcXyVcbCpGJe2L5XuQj',
  // Ví Dogecoin của Elon Musk (được cho là của anh ấy)
  'DOGE': 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L',
};

async function testAllBlockchains() {
  console.log('Bắt đầu kiểm tra các RPC public cho các blockchain...\n');
  
  for (const [blockchain, address] of Object.entries(FAMOUS_ADDRESSES)) {
    console.log(`Kiểm tra ${blockchain} với địa chỉ ${address}...`);
    
    try {
      const balance = await checkBalanceWithSmartRotation(blockchain as BlockchainType, address);
      console.log(`- Kết quả: ${parseFloat(balance) > 0 ? 'THÀNH CÔNG' : 'THẤT BẠI'}`);
      console.log(`- Số dư: ${balance}`);
    } catch (error) {
      console.error(`- Lỗi: ${error}`);
    }
    
    console.log('-------------------');
  }
  
  console.log('\nĐã hoàn thành kiểm tra.');
}

testAllBlockchains();