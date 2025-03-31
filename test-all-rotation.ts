/**
 * Test cơ chế xoay vòng thông minh ngẫu nhiên cho tất cả các blockchain
 * Cơ chế xoay vòng ngẫu nhiên giúp phân tán tải khi nhiều phiên cùng hoạt động
 * Tích hợp cơ chế tự động tạm dừng API key bị rate limit trong 1 phút
 */
import {
  checkBitcoinBalance
} from './server/blockchain/api-smart-rotation-btc';
import {
  checkEthereumBalance
} from './server/blockchain/api-smart-rotation-eth';
import {
  checkBscBalance
} from './server/blockchain/api-smart-rotation-bsc';
import {
  checkSolanaBalance
} from './server/blockchain/api-smart-rotation-sol';
import {
  checkDogecoinBalance
} from './server/blockchain/api-smart-rotation-doge';

// Địa chỉ ví test
const testAddresses = {
  BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Satoshi's address
  ETH: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Vitalik's address
  BSC: '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3', // Binance: Hot Wallet
  SOL: 'DYw8jMTrZqRYeQHKMXgwFtKD5JK9xutTGWW8nSAXAhUw', // SOL: Phantom Foundation
  DOGE: 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L', // DOGE: Largest Dogecoin Address
};

/**
 * Test cơ chế xoay vòng ngẫu nhiên Bitcoin
 */
async function testBitcoinRotation() {
  try {
    console.log('Test cơ chế xoay vòng ngẫu nhiên Bitcoin...');
    for (let i = 0; i < 5; i++) {
      const balance = await checkBitcoinBalance(testAddresses.BTC);
      console.log(`Lần ${i + 1}: Balance = ${balance} BTC`);
    }
    console.log('Hoàn thành test Bitcoin\n');
  } catch (error) {
    console.error('Lỗi test Bitcoin:', error);
  }
}

/**
 * Test cơ chế xoay vòng ngẫu nhiên Ethereum
 */
async function testEthereumRotation() {
  try {
    console.log('Test cơ chế xoay vòng ngẫu nhiên Ethereum...');
    for (let i = 0; i < 5; i++) {
      const balance = await checkEthereumBalance(testAddresses.ETH);
      console.log(`Lần ${i + 1}: Balance = ${balance} ETH`);
    }
    console.log('Hoàn thành test Ethereum\n');
  } catch (error) {
    console.error('Lỗi test Ethereum:', error);
  }
}

/**
 * Test cơ chế xoay vòng ngẫu nhiên BSC
 */
async function testBscRotation() {
  try {
    console.log('Test cơ chế xoay vòng ngẫu nhiên BSC...');
    for (let i = 0; i < 5; i++) {
      const balance = await checkBscBalance(testAddresses.BSC);
      console.log(`Lần ${i + 1}: Balance = ${balance} BNB`);
    }
    console.log('Hoàn thành test BSC\n');
  } catch (error) {
    console.error('Lỗi test BSC:', error);
  }
}

/**
 * Test cơ chế xoay vòng ngẫu nhiên Solana
 */
async function testSolanaRotation() {
  try {
    console.log('Test cơ chế xoay vòng ngẫu nhiên Solana...');
    for (let i = 0; i < 5; i++) {
      const balance = await checkSolanaBalance(testAddresses.SOL);
      console.log(`Lần ${i + 1}: Balance = ${balance} SOL`);
    }
    console.log('Hoàn thành test Solana\n');
  } catch (error) {
    console.error('Lỗi test Solana:', error);
  }
}

/**
 * Test cơ chế xoay vòng ngẫu nhiên Dogecoin
 */
async function testDogecoinRotation() {
  try {
    console.log('Test cơ chế xoay vòng ngẫu nhiên Dogecoin...');
    for (let i = 0; i < 5; i++) {
      const balance = await checkDogecoinBalance(testAddresses.DOGE);
      console.log(`Lần ${i + 1}: Balance = ${balance} DOGE`);
    }
    console.log('Hoàn thành test Dogecoin\n');
  } catch (error) {
    console.error('Lỗi test Dogecoin:', error);
  }
}

/**
 * Chạy tất cả các test
 */
async function runAllTests() {
  console.log('Bắt đầu test tất cả các cơ chế xoay vòng thông minh ngẫu nhiên...\n');
  
  await testBitcoinRotation();
  await testEthereumRotation();
  await testBscRotation();
  await testSolanaRotation();
  await testDogecoinRotation();
  
  console.log('Hoàn thành tất cả các test!');
}

// Chạy tất cả các test
runAllTests().catch(err => {
  console.error('Lỗi chung:', err);
});