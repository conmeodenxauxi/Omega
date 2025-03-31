/**
 * Script kiểm tra cơ chế phân bổ ngẫu nhiên cho ETH và BSC
 */
import { checkEthereumBalance } from "./server/blockchain/api-smart-rotation-eth";
import { checkBscBalance } from "./server/blockchain/api-smart-rotation-bsc";

async function testEthereumRandom() {
  console.log('=== Kiểm tra phân phối ngẫu nhiên Ethereum ===');
  
  // Địa chỉ Ethereum để kiểm tra
  const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Vitalik

  try {
    // Thực hiện kiểm tra
    console.log(`Kiểm tra số dư ETH cho ${testAddress}`);
    const balance = await checkEthereumBalance(testAddress);
    console.log(`Số dư ETH: ${balance}`);
  } catch (error) {
    console.error("Lỗi kiểm tra Ethereum:", error);
  }
}

async function testBscRandom() {
  console.log('\n=== Kiểm tra phân phối ngẫu nhiên BSC ===');
  
  // Địa chỉ BSC để kiểm tra
  const testAddress = '0x8894e0a0c962cb723c1976a4421c95949be2d4e3'; // BSC addrress

  try {
    // Thực hiện kiểm tra
    console.log(`Kiểm tra số dư BSC cho ${testAddress}`);
    const balance = await checkBscBalance(testAddress);
    console.log(`Số dư BSC: ${balance}`);
  } catch (error) {
    console.error("Lỗi kiểm tra BSC:", error);
  }
}

async function runTests() {
  console.log('*** Bắt đầu kiểm tra phân phối ngẫu nhiên ETH và BSC ***\n');
  
  // Kiểm tra Ethereum
  await testEthereumRandom();
  
  // Kiểm tra BSC
  await testBscRandom();
  
  console.log('\n*** Hoàn thành tất cả kiểm tra ***');
}

// Chạy tất cả các test
runTests().catch(error => {
  console.error('Lỗi trong quá trình kiểm tra:', error);
});