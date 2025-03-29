/**
 * API Keys cho việc tương tác với các blockchain khác nhau
 * Sử dụng rotation pattern thông minh để tránh rate limit
 */

import { BlockchainType } from '@shared/schema';

/**
 * Đại diện cho một API endpoint và key cấu hình
 */
export interface ApiEndpoint {
  name: string;
  type: 'public' | 'private';
  url: string;
  headers?: Record<string, string>;
  method?: string;
  body?: any;
  needsApiKey?: boolean;
  requiresAuth?: boolean;
  formatUrl?: (address: string, apiKey?: string) => string;
  formatHeaders?: (apiKey?: string) => Record<string, string>;
  formatBody?: (address: string, apiKey?: string) => any;
  callCount: number;
}

/**
 * Lưu trữ API keys theo blockchain và provider
 */
const apiKeys: Record<string, string[]> = {
  // Bitcoin API keys
  'BTC_BLOCKCYPHER': [
    'bcb10430b01a484c88cd0dede458ab5c',
    '11fe78d84a02463a98a5b031b74d42ce',
    '40f6118885b14579a8a9b192e362b95f',
    '20cfac708c3840aeaf1be8e8e979d309',
    'f35a08e245d14504a8b8d291fa37586e',
    '1d75a4d512044057b766ca70fe544492',
    '40996bd34dd944788dd3bcff1e8d57b2',
    '2da2cc4c71d94ca79b18bf98a8040612',
    'ec575f3135e94d54b105de10c92109c0'
  ],
  
  // Getblock.io keys for Bitcoin
  'BTC_GETBLOCK': [
    'ebbee62f37eb4c89b0acc200e831dcad',
    '053fa1bf9c9643b09e912a0d06795fb7',
    '6ac4cccd0b7047f0be735acbb6064d5f',
    '0c7f9c191e62464b881018686e181494',
    'c9ed0e0e38474b758aca48a07606be3f',
    '4ce3dd86a29443fdacc7f09f0ff647ca',
    'a2273958b2eb418fbcdd59fa660662a8',
    '24d6f87cf4a24bf590214f369987430a',
    '32b592a03ca2485cb132a65a30c4dd91',
    'ad68799ec77f4c8eab47606b675711c3',
    '2ec865b2ff584ed4b0694440d0b8da56',
    '827fb2a6584343298d63cc88f9ff4c8f',
    'baae205eee014a09b259d279a4675a2d',
    '565dc71644c540198119e0182d3ecb69',
    'e79207eb887d44139303b8de38301b3e',
    'be0fdc9e04254a9fbd1dc2844cdeb208'
  ],
  
  // Ethereum API Keys
  'ETH_ETHERSCAN': [
    '6HR4FUXUD5FH36DDKTK9TA3B5WKWR44YP7',
    'HPMEDCEEEA7E6J88PG9M537WEQKG4KCCB5',
    'K1M8UDC11K6S1V7VEQ935EJ7FEE4HPM2NU',
    'IXJ5QWRMTS7PN6VWZBPYB5JU2NXF4E2VTN',
    'VRQ3TVXNRCRRATUWSWIESHT4KGU2QR4GH4',
    '2GQ4QNFWYIZZCESJ3D25DBDG7PYHQPGEW2',
    'RNGF5FWH61KIVIESQHKKTA1NFUHRVPQCX6',
    'XE1PPFNEFWF4QMRIF969ITHBXXSFPBRKDR'
  ],
  
  // Binance Smart Chain API Keys
  'BSC_BSCSCAN': [
    'SC7YSPT8Y3MGPMCQSA4NRZ92UARVVWNQ1F',
    'JM5N75SSNBA2XN88BUGVX6H3TSSZD49QF8',
    'GM4IDJPDAXUYT9P29NUGIDW3HDW66GH98N',
    'KUNAHVNV814NTCQSXS4DW5WX3CAWAAKGDC',
    'C9IDICZE45MKSUE4IKGAKZ2RDIXUJGXB9P',
    'T8FNJ8M7TCQ4AIRPPMS2GWZBBY96YCQRKT',
    'BA3KWB3GSXJW3G33FC75RVE6C1HYY81JR7',
    'KXTPQ38KJ4GEW4TEUVY36RZHPHRUKDVJJD'
  ],
  
  // Solana API Keys (Helius)
  'SOL_HELIUS': [
    'f4b8bccc-ad42-4379-83aa-12037a668596',
    '4634a127-8c86-4f9f-b293-f089744ca86e',
    '6d5a7770-ef7a-4f6f-b24a-3b64a0ac6e24',
    'a3e52c63-33f2-485e-a3e0-932fb1f085cd',
    '12e936a0-b725-4266-8900-10b0a79f0dd4',
    'f4cd2a56-6331-4932-9132-d952b5580eac',
    '32025dc0-9eaa-40bc-b8c3-c9a8cf61aa27',
    '0afb8bd5-9ae6-4fc3-ad24-6a5665eb3431',
    '12282f04-2a6c-4c28-8c97-7015f6738d4a',
    'fec6c5c0-e0e1-4e2b-9e6e-1045b43b57c3',
    '105edf5f-5c01-414d-beb9-031f47031430',
    'c5ebef03-3ad4-4db9-ae81-6e495e6b16fd',
    '5a87ad8b-ed4b-4dac-ab1d-be7aed7fd46a',
    'dc8d3765-7ba1-420f-bc4e-a3bbfd612491',
    '85121755-53e0-42b2-b70e-efeee8bf9576',
    'b3c82ea9-5a04-4688-9efc-e960b24b3e07',
    'd4077d9b-8183-4708-90e7-6d64449dd09e',
    '88a214e2-b5b9-45eb-803d-2f3c6ab5aa50',
    '3bcac472-0eb9-4404-8d20-bb25ca9dadc8',
    'c9fe92c4-6d56-4f0c-8c3f-99ccf9685d7c'
  ],
  
  // Dogecoin API Keys (Cryptoapis.io)
  'DOGE_CRYPTOAPIS': [
    '2cc480292ad73e22db79168c3981fc1063640846',
    'f325c94f37645a29b031e9d03fd7f17e775ce6b5',
    'afccc4af98acc32ec64deec50674741a64eb8daf',
    '07b9c6ed0579e59735560835bc8fc5db9966edfd',
    'accc04da9b1d39a2f9b5dc1ff64a2e8409225c28',
    '9054fc47b1e99099821c8e159ff83f5137544b59',
    'df39de20267a0514f1a9afdabfd8568ab38eda70',
    '39d6dbf7acbd9775ffc455726d494b8085dcfbb1',
    '9b92bc908818b6d89da8b171b0c68d9382970775',
    'ec39e5960fb38091a2458f21314fba3c8dc6981d',
    '398346886406923578e0d25625870fd7732947b6',
    'b4a1294319c6df5ee99f0c2b27841b0d10ed7073',
    '356f6e5e8c8164e8014b89776944fc34e7d6c6a3',
    '0255a022afc8f069f578bc18814e4da7eed8d257',
    '1922ebdb34e326f16399f4f1bca447e887133c66',
    'fe1b3b78a71d2e6e91945391b6e63fb150868154',
    '6d65f6db8c9b95c879d48dd485a37e402b7b1cf2',
    '76e66decd99da2a5b7990105442cfe1e38791320',
    'b98522605fb9f6b54efd6af0ba88cdffc58a4875',
    'dfd67ca24de0e52dfeae91844731a183ec5ab253',
    '488e2503cedaa795de0f5fcbb51e856ddb9c0f5e',
    '21a93c4767da395e2d2aef3252bb9b47533d3c5d',
    'ee0638974c33442ade72a1e3b95c65da7aa04f81',
    '4c1d0c38ba5071278e41f5b4b3b38b2f3035746c',
    '450bed527dc728e5ea7c9afe3753d7eaf4c810a8',
    'c20c061c10a657dbb165f174908f55c6d7ff141e',
    '19ddcc0c7f60d8991aa23ac16624ba954832d0c2',
    'bf5533bfc7e1a54f884dc7ab139884be885aed08',
    '795d5d2924e3ac26d4c24aa90263d575ad583778',
    '535de95dcf44dd2c2f62ad82d708202aa320c400',
    'bb697766f501dc61e081e975524eb5dac705b522'
  ]
};

/**
 * Tạo và lưu trữ các API endpoint cho tất cả các blockchain
 */
const blockchainEndpoints: Record<BlockchainType, ApiEndpoint[]> = {
  'BTC': [
    // Public API (không cần API key)
    {
      name: 'BlockCypher Public',
      type: 'public',
      url: '',
      formatUrl: (address) => `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      needsApiKey: false,
      callCount: 0
    },
    // Blockchair Public API
    {
      name: 'Blockchair',
      type: 'public',
      url: '',
      formatUrl: (address) => `https://api.blockchair.com/bitcoin/dashboards/address/${address}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      needsApiKey: false,
      callCount: 0
    },
    // BlockCypher API với key
    {
      name: 'BlockCypher',
      type: 'private',
      url: '',
      formatUrl: (address, apiKey) => `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance?token=${apiKey}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      needsApiKey: true,
      callCount: 0
    },
    // GetBlock API 
    {
      name: 'GetBlock',
      type: 'private',
      url: '',
      formatUrl: (address, apiKey) => `https://go.getblock.io/${apiKey}/api/v2/address/${address}?details=basic`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      needsApiKey: true,
      callCount: 0
    }
  ],
  'ETH': [
    // Public API (Etherscan без ключа - ограниченное количество запросов)
    {
      name: 'Etherscan Public',
      type: 'public',
      url: '',
      formatUrl: (address) => `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      needsApiKey: false,
      callCount: 0
    },
    // Etherscan с API key
    {
      name: 'Etherscan',
      type: 'private',
      url: '',
      formatUrl: (address, apiKey) => `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      needsApiKey: true,
      callCount: 0
    }
  ],
  'BSC': [
    // Public API
    {
      name: 'BSCScan Public',
      type: 'public',
      url: '',
      formatUrl: (address) => `https://api.bscscan.com/api?module=account&action=balance&address=${address}&tag=latest`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      needsApiKey: false,
      callCount: 0
    },
    // BSCScan с API key
    {
      name: 'BSCScan',
      type: 'private',
      url: '',
      formatUrl: (address, apiKey) => `https://api.bscscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      needsApiKey: true,
      callCount: 0
    }
  ],
  'SOL': [
    // Public RPC API
    {
      name: 'Solana RPC',
      type: 'public',
      url: 'https://api.mainnet-beta.solana.com',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      formatBody: (address) => {
        return JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address]
        });
      },
      needsApiKey: false,
      callCount: 0
    },
    // Helius API
    {
      name: 'Helius',
      type: 'private',
      url: '',
      formatUrl: (address, apiKey) => `https://api.helius.xyz/v0/addresses/${address}/balances?api-key=${apiKey}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      needsApiKey: true,
      callCount: 0
    }
  ],
  'DOGE': [
    // Public APIs
    {
      name: 'Blockchair',
      type: 'public',
      url: '',
      formatUrl: (address) => `https://api.blockchair.com/dogecoin/dashboards/address/${address}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      needsApiKey: false,
      callCount: 0
    },
    {
      name: 'SoChain',
      type: 'public',
      url: '',
      formatUrl: (address) => `https://sochain.com/api/v2/get_address_balance/DOGE/${address}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      needsApiKey: false,
      callCount: 0
    },
    // CryptoAPIs
    {
      name: 'CryptoAPIs',
      type: 'private',
      url: '',
      formatUrl: (address) => `https://rest.cryptoapis.io/blockchain-data/doge/mainnet/addresses/${address}/balance?context=yourExampleString`,
      formatHeaders: (apiKey) => ({
        'Content-Type': 'application/json',
        'X-API-Key': apiKey || ''
      }),
      method: 'GET',
      needsApiKey: true,
      callCount: 0
    }
  ]
};

// Lưu trữ index hiện tại của từng provider
const apiKeyIndices: Record<string, number> = {};

/**
 * Lấy ApiEndpoint tiếp theo theo chiến lược xoay vòng thông minh
 * @param blockchain Loại blockchain
 * @returns ApiEndpoint được chọn
 */
export function getNextEndpoint(blockchain: BlockchainType): ApiEndpoint {
  const endpoints = blockchainEndpoints[blockchain];
  if (!endpoints || endpoints.length === 0) {
    throw new Error(`Không có endpoint nào cho blockchain: ${blockchain}`);
  }

  // Sắp xếp endpoints theo số lần gọi, ưu tiên endpoint ít được sử dụng nhất
  endpoints.sort((a, b) => a.callCount - b.callCount);
  
  // Lấy endpoint có số lần gọi ít nhất
  const endpoint = endpoints[0];
  
  // Tăng số lần gọi
  endpoint.callCount++;
  
  console.log(`Đã chọn endpoint ${endpoint.name} cho ${blockchain} (đã gọi ${endpoint.callCount} lần)`);
  
  return endpoint;
}

/**
 * Lấy API key tiếp theo từ danh sách rotation
 * @param provider Tên nhà cung cấp API
 * @returns API key
 */
export function getNextApiKey(provider: string): string {
  if (!apiKeys[provider] || apiKeys[provider].length === 0) {
    throw new Error(`Không có API key nào cho provider: ${provider}`);
  }
  
  // Khởi tạo index nếu chưa tồn tại
  if (apiKeyIndices[provider] === undefined) {
    apiKeyIndices[provider] = 0;
  } else {
    // Tăng index và reset nếu vượt quá array length
    apiKeyIndices[provider] = (apiKeyIndices[provider] + 1) % apiKeys[provider].length;
  }
  
  return apiKeys[provider][apiKeyIndices[provider]];
}

/**
 * Lấy API key cho endpoint và provider tương ứng
 * @param blockchain Loại blockchain
 * @param endpoint API endpoint cần key
 * @returns API key hoặc rỗng nếu không cần key
 */
export function getApiKey(blockchain: BlockchainType, endpointName?: string): string {
  if (!endpointName) {
    // Lấy endpoint tiếp theo theo chiến lược xoay vòng
    const endpoint = getNextEndpoint(blockchain);
    endpointName = endpoint.name;
  }
  
  // Xác định provider dựa trên tên endpoint
  let provider: string | undefined;
  
  switch (endpointName) {
    case 'BlockCypher':
      provider = 'BTC_BLOCKCYPHER';
      break;
    case 'GetBlock':
      provider = 'BTC_GETBLOCK';
      break;
    case 'Etherscan':
      provider = 'ETH_ETHERSCAN';
      break;
    case 'BSCScan':
      provider = 'BSC_BSCSCAN';
      break;
    case 'Helius':
      provider = 'SOL_HELIUS';
      break;
    case 'CryptoAPIs':
      provider = 'DOGE_CRYPTOAPIS';
      break;
    default:
      // Endpoint công khai không cần API key
      return '';
  }
  
  return getNextApiKey(provider);
}

/**
 * Chuẩn bị URL và headers cho API request
 * @param blockchain Loại blockchain
 * @param address Địa chỉ ví
 * @returns {url, headers, method, body} cho API request
 */
export function prepareApiRequest(blockchain: BlockchainType, address: string): { 
  url: string, 
  headers: Record<string, string>,
  method: string,
  body?: string 
} {
  // Lấy endpoint tiếp theo theo chiến lược xoay vòng
  const endpoint = getNextEndpoint(blockchain);
  
  let apiKey = '';
  if (endpoint.needsApiKey) {
    // Xác định provider từ tên endpoint
    apiKey = getApiKey(blockchain, endpoint.name);
  }
  
  // Chuẩn bị URL
  const url = endpoint.formatUrl 
    ? endpoint.formatUrl(address, apiKey) 
    : endpoint.url;
  
  // Chuẩn bị headers
  const headers = endpoint.formatHeaders 
    ? endpoint.formatHeaders(apiKey) 
    : endpoint.headers || { 'Content-Type': 'application/json' };
  
  // Chuẩn bị body nếu cần
  const body = endpoint.formatBody 
    ? endpoint.formatBody(address, apiKey) 
    : undefined;
  
  return { 
    url, 
    headers, 
    method: endpoint.method || 'GET',
    body
  };
}

/**
 * Lấy tất cả các cấu hình API cho blockchain
 * @param blockchain Loại blockchain
 * @param address Địa chỉ ví
 * @returns Mảng các cấu hình API
 */
export function getAllApiConfigs(blockchain: BlockchainType, address: string): Array<{
  name: string;
  url: string;
  headers: Record<string, string>;
  method: string;
  body?: string;
}> {
  const endpoints = blockchainEndpoints[blockchain];
  
  return endpoints.map(endpoint => {
    let apiKey = '';
    if (endpoint.needsApiKey) {
      // Nếu endpoint yêu cầu API key, lấy key tiếp theo
      switch (endpoint.name) {
        case 'BlockCypher':
          apiKey = getNextApiKey('BTC_BLOCKCYPHER');
          break;
        case 'GetBlock':
          apiKey = getNextApiKey('BTC_GETBLOCK');
          break;
        case 'Etherscan':
          apiKey = getNextApiKey('ETH_ETHERSCAN');
          break;
        case 'BSCScan':
          apiKey = getNextApiKey('BSC_BSCSCAN');
          break;
        case 'Helius':
          apiKey = getNextApiKey('SOL_HELIUS');
          break;
        case 'CryptoAPIs':
          apiKey = getNextApiKey('DOGE_CRYPTOAPIS');
          break;
      }
    }
    
    // Chuẩn bị URL
    const url = endpoint.formatUrl 
      ? endpoint.formatUrl(address, apiKey) 
      : endpoint.url;
    
    // Chuẩn bị headers
    const headers = endpoint.formatHeaders 
      ? endpoint.formatHeaders(apiKey) 
      : endpoint.headers || { 'Content-Type': 'application/json' };
    
    // Chuẩn bị body nếu cần
    const body = endpoint.formatBody 
      ? endpoint.formatBody(address, apiKey) 
      : undefined;
    
    // Tăng số lần gọi khi tạo cấu hình
    endpoint.callCount++;
    
    return {
      name: endpoint.name,
      url,
      headers,
      method: endpoint.method || 'GET',
      body: body ? JSON.stringify(body) : undefined
    };
  });
}

/**
 * Lấy các config API để sử dụng trong API request
 * @param blockchain Loại blockchain
 * @param address Địa chỉ ví
 * @returns Mảng các cấu hình API
 */
export function getApiConfigs(blockchain: BlockchainType, address: string): Array<{
  name: string;
  url: string;
  headers: Record<string, string>;
  method: string;
  body?: string;
}> {
  return getAllApiConfigs(blockchain, address);
}