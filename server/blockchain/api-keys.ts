/**
 * API Keys cho việc tương tác với các blockchain khác nhau
 * Sử dụng rotation pattern thông minh để tránh rate limit
 */

import { BlockchainType } from '../../shared/schema';

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
    'be0fdc9e04254a9fbd1dc2844cdeb208',
    '72ac9da16bc4458ca57dfe0dc61fa8b2'
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
    'XE1PPFNEFWF4QMRIF969ITHBXXSFPBRKDR',
    'JIBT19A992QRZIS91MM1WYDPESS3R64ACX',
    'K2GNPYITPPVNFYYX837KWMCJICPNAJMVSG'
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
    'KXTPQ38KJ4GEW4TEUVY36RZHPHRUKDVJJD',
    'YSV3J1572I7BPW7I8JG92YB1V4W9YNY4N2',
    'IGWA6ZTGJ7YY6C8FVEW1TRHRK6VMKU4C95'
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
    'c9fe92c4-6d56-4f0c-8c3f-99ccf9685d7c',
    'f769413c-ebdf-4df9-841a-aa054fbce6b2', // Key mới được thêm vào
    'a5f7d1bc-23f3-4833-80e6-279774f98ef1'  // Key mới được thêm vào (30/03/2025)
  ],
  
  // Bitcoin API Keys (Tatum.io)
  'BTC_TATUM': [
    't-67e888a2832893ddeb2bfbce-5c2156d4a3274787897d1e33',
    't-67e88a6d5953fae328c284f9-5c1d92b1ccd74b1b88dee74a',
    't-67e88dad5953fae328c28507-cace0aa2db32403e979b03b6',
    't-67e891c09c386072971b6f58-de256a0565b049ce8d537e8e',
    't-67e892fb5953fae328c2850f-a7b5e0f5c750419fbe1b83c2',
    't-67e8951d5953fae328c28518-72cb0d0d1c534f0aa91cea65',
    't-67e896559c386072971b6f63-8090b6da562348cfb25aba8e',
    't-67e8975d9c386072971b6f6a-c4763690c181424d9daebb14',
    't-67e898829c386072971b6f73-569069b90c4843da859a4b9e',
    't-67e8994f832893ddeb2bfbe0-245ad020ff9b445381cac588',
    // Thêm 5 API key mới cho BTC
    't-67e88227832893ddeb2bfba8-aa301b8f7c554271a8eebc10',
    't-67e88349832893ddeb2bfbb4-1946d051f1084b5ebcbf6927',
    't-67e883175953fae328c284e9-464883db18be4955a60a683f',
    't-67e88422832893ddeb2bfbbd-c890492b88b0459fbc51bf16',
    't-67e884e8832893ddeb2bfbc6-3c30b4a88f4b4d00b57a327b',
    // Key mới được thêm vào
    't-67e8b19d5953fae328c2853a-6c3e0ea944094a47b3ef59f4'
  ],
  
  // Dogecoin API Keys (Tatum.io)
  'DOGE_TATUM': [
    't-67e87aff5953fae328c284a2-00409cd135ad4247badffb32',
    't-67e879369c386072971b6f11-2570f79dc58f410bacdfcfd6',
    't-67e87c459c386072971b6f1b-8177400282744943842bc637',
    't-67e87ceb832893ddeb2bfb85-f0e675bd2a5e4d729fa02052',
    't-67e87d41832893ddeb2bfb8d-87242e2dff6a4a9aa4864197',
    't-67e87def5953fae328c284ae-a0f9aced6e134936a9ea1f33',
    't-67e87ed25953fae328c284be-eb439fa5f5724331a5142880',
    't-67e87eb79c386072971b6f25-48419e24b4a1446a8877e9b2',
    't-67e87f8b832893ddeb2bfb99-afff5832b65d431aa8ded26c',
    't-67e87fad9c386072971b6f33-5a969661d2e340e992459d9f',
    't-67e8804e5953fae328c284c9-0952ed23a0ae4804afb3e95d',
    't-67e880725953fae328c284d0-0bfda87435944ba0a238df87',
    't-67e881525953fae328c284da-267ac23e0f56486b94619a60',
    't-67e881379c386072971b6f3c-d96a8026e14e40b1911baa77',
    't-67e8827b5953fae328c284e2-0b5d95a69912480aa06d7c1a'
  ],
  
  // Dogecoin API Keys (NowNodes.io)
  'DOGE_NOWNODES': [
    '4eea1226-2f22-44af-9a91-5c61f2c82a9d',
    'd3f94cf8-8b38-45a3-b9c2-a07f7d8ca8e9',
    '5167f556-74da-4f98-8952-e9df40ada190',
    '2b19934f-8ddf-4132-a2cc-1e3394df2598',
    '34c78e51-3bdc-4671-a387-57eda6bb4618',
    'eb1a0446-3864-427b-a8a4-2d438f096298',
    'c0d52e4b-d83d-4c04-bc78-7483a2f4e825',
    'b3e4104e-e49d-484e-a1b5-ba36d8eddce5',
    '45f3ea7c-6c05-49d4-8a34-8ad134580713',
    'af28b384-d0ce-4115-8a8c-0cc933d0d691',
    'b08feda7-2211-426e-9238-84778de097ea',
    '2bef078b-8ab5-41f6-bccb-0d900fe6507b'
  ]
};

/**
 * Tạo và lưu trữ các API endpoint cho tất cả các blockchain
 */
export const blockchainEndpoints: Record<BlockchainType, ApiEndpoint[]> = {
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
    },
    // Tatum.io API cho Bitcoin
    {
      name: 'BTC_Tatum',
      type: 'private',
      url: '',
      formatUrl: (address) => `https://api.tatum.io/v3/bitcoin/address/balance/${address}`,
      formatHeaders: (apiKey) => ({
        'Content-Type': 'application/json',
        'x-api-key': apiKey || ''
      }),
      method: 'GET',
      needsApiKey: true,
      callCount: 0
    }
  ],
  'ETH': [
    // Etherscan with API key
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
    // BSCScan with API key
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
    // Tatum.io API
    {
      name: 'Tatum',
      type: 'private',
      url: '',
      formatUrl: (address) => `https://api.tatum.io/v3/dogecoin/address/balance/${address}`,
      formatHeaders: (apiKey) => ({
        'Content-Type': 'application/json',
        'x-api-key': apiKey || ''
      }),
      method: 'GET',
      needsApiKey: true,
      callCount: 0
    },
    // NowNodes.io API cho Dogecoin
    {
      name: 'NowNodes',
      type: 'private',
      url: '',
      formatUrl: (address) => `https://dogebook.nownodes.io/api/address/${address}`,
      formatHeaders: (apiKey) => ({
        'Content-Type': 'application/json',
        'api-key': apiKey || ''
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
    case 'BTC_Tatum':
      provider = 'BTC_TATUM';
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
    case 'Tatum':
      provider = 'DOGE_TATUM';
      break;
    case 'NowNodes':
      provider = 'DOGE_NOWNODES';
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
        case 'BTC_Tatum':
          apiKey = getNextApiKey('BTC_TATUM');
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
        case 'Tatum':
          apiKey = getNextApiKey('DOGE_TATUM');
          break;
        case 'NowNodes':
          apiKey = getNextApiKey('DOGE_NOWNODES');
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