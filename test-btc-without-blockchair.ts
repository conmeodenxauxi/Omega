/**
 * Kiểm tra đơn giản cho cơ chế xoay vòng Bitcoin nhưng loại bỏ Blockchair
 */

// Import module cần thiết
import fetch from 'node-fetch';
import { getApiKey } from './server/blockchain/api-keys';

interface ApiConfig {
  name: string;
  url: string;
  headers: Record<string, string>;
  method: string;
}

// Test các API Bitcoin mà không sử dụng Blockchair
async function testBitcoinAPIs() {
  console.log('== KIỂM TRA CÁC API BITCOIN (KHÔNG DÙNG BLOCKCHAIR) ==');
  
  // Địa chỉ Bitcoin để kiểm tra
  const testAddress = '1BitcoinEaterAddressDontSendf59kuE';
  
  // Danh sách các API config (không bao gồm Blockchair và SoChain)
  const apiConfigs: ApiConfig[] = [
    {
      name: 'BlockCypher',
      url: `https://api.blockcypher.com/v1/btc/main/addrs/${testAddress}/balance`,
      headers: { 'Content-Type': 'application/json' },
      method: 'GET'
    },
    {
      name: 'Blockchain.info',
      url: `https://blockchain.info/balance?active=${testAddress}`,
      headers: { 'Content-Type': 'application/json' },
      method: 'GET'
    },
    {
      name: 'Blockstream',
      url: `https://blockstream.info/api/address/${testAddress}`,
      headers: { 'Content-Type': 'application/json' },
      method: 'GET'
    },
    {
      name: 'Mempool',
      url: `https://mempool.space/api/address/${testAddress}`,
      headers: { 'Content-Type': 'application/json' },
      method: 'GET'
    },
    {
      name: 'GetBlock',
      url: `https://go.getblock.io/${getApiKey('BTC', 'GetBlock')}/api/v2/address/${testAddress}?details=basic`,
      headers: { 'Content-Type': 'application/json' },
      method: 'GET'
    }
  ];
  
  // Thêm Tatum với API key
  const tatumApiKey = getApiKey('BTC', 'BTC_Tatum');
  apiConfigs.push({
    name: 'BTC_Tatum',
    url: `https://api.tatum.io/v3/bitcoin/address/balance/${testAddress}`,
    headers: { 
      'Content-Type': 'application/json',
      'x-api-key': tatumApiKey
    },
    method: 'GET'
  });
  
  // Kiểm tra từng API
  for (const config of apiConfigs) {
    try {
      console.log(`\nKiểm tra API: ${config.name}`);
      console.log(`URL: ${config.url}`);
      
      const startTime = Date.now();
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      const endTime = Date.now();
      
      console.log(`✅ Phản hồi thành công (${endTime - startTime}ms)`);
      console.log('Dữ liệu:', JSON.stringify(data).substring(0, 200) + '...');
      
      // Parse số dư
      let balance = '0';
      
      switch (config.name) {
        case 'BlockCypher':
          if (data && typeof data.balance !== 'undefined') {
            balance = (data.balance / 100000000).toFixed(8);
          }
          break;
          
        case 'GetBlock':
          if (data && data.balance) {
            balance = (parseInt(data.balance) / 100000000).toFixed(8);
          }
          break;
          
        case 'BTC_Tatum':
          if (data && data.incoming && data.outgoing) {
            const incomingSat = parseFloat(data.incoming) || 0;
            const outgoingSat = parseFloat(data.outgoing) || 0;
            balance = (incomingSat - outgoingSat).toFixed(8);
          }
          break;
          
        case 'Blockchain.info':
          if (data && data[testAddress] && typeof data[testAddress].final_balance !== 'undefined') {
            balance = (data[testAddress].final_balance / 100000000).toFixed(8);
          }
          break;
          
        case 'Blockstream':
        case 'Mempool':
          if (data && data.chain_stats && 
              typeof data.chain_stats.funded_txo_sum !== 'undefined' && 
              typeof data.chain_stats.spent_txo_sum !== 'undefined') {
            const funded = data.chain_stats.funded_txo_sum;
            const spent = data.chain_stats.spent_txo_sum;
            balance = ((funded - spent) / 100000000).toFixed(8);
          }
          break;
          
        case 'SoChain':
          if (data && data.status === 'success' && data.data && data.data.confirmed_balance) {
            balance = parseFloat(data.data.confirmed_balance).toFixed(8);
          }
          break;
      }
      
      console.log(`Số dư: ${balance} BTC`);
      
    } catch (error) {
      console.error(`❌ Lỗi với ${config.name}:`, error);
    }
    
    // Đợi 1 giây giữa các request để tránh rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n== KIỂM TRA HOÀN TẤT ==');
}

// Chạy test
testBitcoinAPIs().catch(error => {
  console.error('Lỗi trong quá trình kiểm tra:', error);
});