/**
 * Script kiểm tra tất cả các endpoints trong cơ chế xoay vòng để xác định khả năng kiểm tra số dư
 */
import fetch from 'node-fetch';

// Địa chỉ ví test có số dư
const testAddresses = {
  ETH: '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8', // Binance cold wallet
  BSC: '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3', // Binance hot wallet
  SOL: 'E8HuuLqqzqoCr9yvEtmUbFrHxoHyrpMisH2Y21XGFCEB' // Solana-rich address
};

/**
 * Kiểm tra endpoint Ethereum
 */
async function checkEthEndpoints() {
  console.log('\n=== KIỂM TRA ETHEREUM ENDPOINTS ===');
  
  const endpoints = [
    {
      name: 'ETH-Public-1',
      url: 'https://eth.llamarpc.com',
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [testAddresses.ETH, 'latest']
      }),
      headers: { 'Content-Type': 'application/json' }
    },
    {
      name: 'ETH-Public-2',
      url: 'https://ethereum.publicnode.com',
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [testAddresses.ETH, 'latest']
      }),
      headers: { 'Content-Type': 'application/json' }
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nKiểm tra ${endpoint.name}...`);
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: endpoint.headers,
        body: endpoint.body
      });
      
      const data = await response.json();
      console.log('Phản hồi:', JSON.stringify(data, null, 2));
      
      if (data && data.result) {
        const balanceWei = BigInt(data.result);
        const balanceETH = (Number(balanceWei) / 1e18).toFixed(18);
        console.log(`Số dư: ${balanceETH} ETH`);
        console.log(`✅ ${endpoint.name} HOẠT ĐỘNG TỐT`);
      } else {
        console.log(`❌ ${endpoint.name} KHÔNG LẤY ĐƯỢC SỐ DƯ`);
      }
    } catch (error) {
      console.error(`❌ Lỗi kiểm tra ${endpoint.name}:`, error);
    }
  }
}

/**
 * Kiểm tra endpoint BSC
 */
async function checkBscEndpoints() {
  console.log('\n=== KIỂM TRA BSC ENDPOINTS ===');
  
  const endpoints = [
    {
      name: 'BSC-RPC',
      url: 'https://bsc-dataseed1.binance.org',
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [testAddresses.BSC, 'latest']
      }),
      headers: { 'Content-Type': 'application/json' }
    },
    {
      name: 'BSC-RPC-2',
      url: 'https://bsc-dataseed2.binance.org',
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [testAddresses.BSC, 'latest']
      }),
      headers: { 'Content-Type': 'application/json' }
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nKiểm tra ${endpoint.name}...`);
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: endpoint.headers,
        body: endpoint.body
      });
      
      const data = await response.json();
      console.log('Phản hồi:', JSON.stringify(data, null, 2));
      
      if (data && data.result) {
        const balanceWei = BigInt(data.result);
        const balanceBNB = (Number(balanceWei) / 1e18).toFixed(18);
        console.log(`Số dư: ${balanceBNB} BNB`);
        console.log(`✅ ${endpoint.name} HOẠT ĐỘNG TỐT`);
      } else {
        console.log(`❌ ${endpoint.name} KHÔNG LẤY ĐƯỢC SỐ DƯ`);
      }
    } catch (error) {
      console.error(`❌ Lỗi kiểm tra ${endpoint.name}:`, error);
    }
  }
}

/**
 * Kiểm tra endpoint SOL
 */
async function checkSolEndpoints() {
  console.log('\n=== KIỂM TRA SOLANA ENDPOINTS ===');
  
  const endpoints = [
    {
      name: 'Solana-RPC-MainNet',
      url: 'https://api.mainnet-beta.solana.com',
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [testAddresses.SOL]
      }),
      headers: { 'Content-Type': 'application/json' }
    },

  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nKiểm tra ${endpoint.name}...`);
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: endpoint.headers,
        body: endpoint.body
      });
      
      const data = await response.json();
      console.log('Phản hồi:', JSON.stringify(data, null, 2));
      
      if (data && data.result && data.result.value !== undefined) {
        const balanceSOL = (data.result.value / 1e9).toFixed(9);
        console.log(`Số dư: ${balanceSOL} SOL`);
        console.log(`✅ ${endpoint.name} HOẠT ĐỘNG TỐT`);
      } else {
        console.log(`❌ ${endpoint.name} KHÔNG LẤY ĐƯỢC SỐ DƯ`);
      }
    } catch (error) {
      console.error(`❌ Lỗi kiểm tra ${endpoint.name}:`, error);
    }
  }
}

/**
 * Chạy tất cả các kiểm tra
 */
async function runTests() {
  console.log('=== BẮT ĐẦU KIỂM TRA TẤT CẢ ENDPOINTS ===');
  console.log('Địa chỉ kiểm tra:');
  console.log(`ETH: ${testAddresses.ETH}`);
  console.log(`BSC: ${testAddresses.BSC}`);
  console.log(`SOL: ${testAddresses.SOL}`);
  
  await checkEthEndpoints();
  await checkBscEndpoints();
  await checkSolEndpoints();
  
  console.log('\n=== HOÀN THÀNH KIỂM TRA ===');
}

// Thực thi kiểm tra
runTests().catch(error => {
  console.error('Lỗi chạy kiểm tra:', error);
});