/**
 * Kiểm tra các API RPC miễn phí và API key với địa chỉ của Satoshi
 */

import fetch from 'node-fetch';
import { getApiKey } from './server/blockchain/api-keys';

// Địa chỉ ví của Satoshi Nakamoto (một trong những ví đầu tiên)
const satoshiAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';

interface ApiTest {
  name: string;
  url: string;
  headers?: Record<string, string>;
  method?: string;
  processResponse: (data: any) => string;
  body?: any;
}

// Hàm tạo promise với timeout
const fetchWithTimeout = async (url: string, options: any, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

async function testApi(api: ApiTest): Promise<void> {
  try {
    console.log(`Testing ${api.name}...`);
    
    const method = api.method || 'GET';
    const headers = {
      'Content-Type': 'application/json',
      ...api.headers
    };
    
    const startTime = Date.now();
    const response = await fetchWithTimeout(api.url, {
      method,
      headers,
      body: method === 'POST' ? JSON.stringify(api.body) : undefined
    }, 10000); // 10 giây timeout
    
    if (!response.ok) {
      console.log(`❌ ${api.name}: HTTP error ${response.status}`);
      return;
    }
    
    const data = await response.json();
    const balance = api.processResponse(data);
    const endTime = Date.now();
    
    console.log(`✅ ${api.name}: ${balance} BTC (${endTime - startTime}ms)`);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`❌ ${api.name}: Request timeout`);
    } else {
      console.log(`❌ ${api.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function testAllApis() {
  console.log(`Kiểm tra các API với địa chỉ Satoshi: ${satoshiAddress}\n`);
  
  // Danh sách các API cần test
  const apis: ApiTest[] = [
    // === API RPC miễn phí ===
    {
      name: 'Blockchair',
      url: `https://api.blockchair.com/bitcoin/dashboards/address/${satoshiAddress}`,
      processResponse: (data) => {
        if (data?.data?.[satoshiAddress]?.address?.balance) {
          return (data.data[satoshiAddress].address.balance / 100000000).toFixed(8);
        }
        return 'Không thể xác định số dư';
      }
    },
    {
      name: 'Blockchain.info',
      url: `https://blockchain.info/balance?active=${satoshiAddress}`,
      processResponse: (data) => {
        if (data?.[satoshiAddress]?.final_balance !== undefined) {
          return (data[satoshiAddress].final_balance / 100000000).toFixed(8);
        }
        return 'Không thể xác định số dư';
      }
    },
    {
      name: 'Blockstream',
      url: `https://blockstream.info/api/address/${satoshiAddress}`,
      processResponse: (data) => {
        if (data?.chain_stats?.funded_txo_sum !== undefined && 
            data?.chain_stats?.spent_txo_sum !== undefined) {
          const funded = data.chain_stats.funded_txo_sum;
          const spent = data.chain_stats.spent_txo_sum;
          return ((funded - spent) / 100000000).toFixed(8);
        }
        return 'Không thể xác định số dư';
      }
    },
    {
      name: 'Mempool',
      url: `https://mempool.space/api/address/${satoshiAddress}`,
      processResponse: (data) => {
        if (data?.chain_stats?.funded_txo_sum !== undefined && 
            data?.chain_stats?.spent_txo_sum !== undefined) {
          const funded = data.chain_stats.funded_txo_sum;
          const spent = data.chain_stats.spent_txo_sum;
          return ((funded - spent) / 100000000).toFixed(8);
        }
        return 'Không thể xác định số dư';
      }
    },
    {
      name: 'SoChain',
      url: `https://sochain.com/api/v2/get_address_balance/BTC/${satoshiAddress}`,
      processResponse: (data) => {
        if (data?.status === 'success' && data?.data?.confirmed_balance) {
          return parseFloat(data.data.confirmed_balance).toFixed(8);
        }
        return 'Không thể xác định số dư';
      }
    },
    
    // === API key có phí ===
    {
      name: 'BlockCypher',
      url: `https://api.blockcypher.com/v1/btc/main/addrs/${satoshiAddress}/balance?token=${getApiKey('BTC', 'BlockCypher')}`,
      processResponse: (data) => {
        if (data && typeof data.balance !== 'undefined') {
          return (data.balance / 100000000).toFixed(8);
        }
        return 'Không thể xác định số dư';
      }
    },
    {
      name: 'GetBlock',
      url: `https://go.getblock.io/${getApiKey('BTC', 'GetBlock')}/api/v2/address/${satoshiAddress}?details=basic`,
      processResponse: (data) => {
        if (data && data.balance) {
          return (parseInt(data.balance) / 100000000).toFixed(8);
        }
        return 'Không thể xác định số dư';
      }
    },
    {
      name: 'BTC_Tatum',
      url: `https://api.tatum.io/v3/bitcoin/address/balance/${satoshiAddress}`,
      headers: { 'x-api-key': getApiKey('BTC', 'BTC_Tatum') },
      processResponse: (data) => {
        if (data && data.incoming && data.outgoing) {
          const incomingSat = parseInt(data.incoming) || 0;
          const outgoingSat = parseInt(data.outgoing) || 0;
          return ((incomingSat - outgoingSat) / 100000000).toFixed(8);
        }
        return 'Không thể xác định số dư';
      }
    }
  ];
  
  // Kiểm tra lần lượt từng API
  for (const api of apis) {
    await testApi(api);
    // Đợi 1 giây giữa các request để tránh rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("\n=== KIỂM TRA HOÀN TẤT ===");
}

// Chạy test
testAllApis().catch(error => {
  console.error('Lỗi trong quá trình kiểm tra:', error);
});