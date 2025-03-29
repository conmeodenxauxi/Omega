/**
 * API Keys cho việc tương tác với các blockchain khác nhau
 * Sử dụng rotation pattern để tránh rate limit
 */

import { BlockchainType } from '@shared/schema';

// Interface cho API key store
interface ApiKeyStore {
  [key: string]: string[];
}

// Lưu trữ API keys theo blockchain
const apiKeys: ApiKeyStore = {
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
    '002d2daeb5cb4a4e85caeb38ed8ca486',
    '0b12889cb8a34662a1b6ed05574a3550',
    '1ec50b876ca1407388aa997abf3214f5',
    '2d62a0c06120487fa5e9e7a970ef5383',
    '1ce06538c6f041b498e31d3334f83f2c',
    'e743c997f13141af864ac113fe8f4267',
    'a0a7cf303bf14318b3bb76eca580ffd1',
    'f9a2fedccfec4ef5a8d8b8e37a0bb8c2',
    '50d8155d6d9646c0a409971096004ebd',
    '9db16d06c0ec4040ba1034118adc4d2b'
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
    'fec6c5c0-e0e1-4e2b-9e6e-1045b43b57c3'
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
    'ec39e5960fb38091a2458f21314fba3c8dc6981d'
  ]
};

// Quản lý API key index hiện tại cho rotation
const currentIndexMap: {[key: string]: number} = {};

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
  if (currentIndexMap[provider] === undefined) {
    currentIndexMap[provider] = 0;
  } else {
    // Tăng index và reset nếu vượt quá array length
    currentIndexMap[provider] = (currentIndexMap[provider] + 1) % apiKeys[provider].length;
  }
  
  return apiKeys[provider][currentIndexMap[provider]];
}

/**
 * Lấy API key cho blockchain và provider tương ứng
 * @param blockchain Loại blockchain
 * @param provider Nhà cung cấp API (tùy chọn)
 * @returns API key
 */
export function getApiKey(blockchain: BlockchainType, provider?: string): string {
  switch (blockchain) {
    case 'BTC':
      return provider === 'getblock' 
        ? getNextApiKey('BTC_GETBLOCK')
        : getNextApiKey('BTC_BLOCKCYPHER');
      
    case 'ETH':
      return getNextApiKey('ETH_ETHERSCAN');
      
    case 'BSC':
      return getNextApiKey('BSC_BSCSCAN');
      
    case 'SOL':
      return getNextApiKey('SOL_HELIUS');
      
    case 'DOGE':
      return getNextApiKey('DOGE_CRYPTOAPIS');
      
    default:
      throw new Error(`Không hỗ trợ blockchain: ${blockchain}`);
  }
}

/**
 * Kiểm tra API key có tồn tại cho blockchain và provider
 * @param blockchain Loại blockchain
 * @param provider Provider (tùy chọn)
 * @returns boolean
 */
export function hasApiKey(blockchain: BlockchainType, provider?: string): boolean {
  try {
    getApiKey(blockchain, provider);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Lấy endpoint URL cho blockchain tương ứng
 * @param blockchain Loại blockchain
 * @param address Địa chỉ ví (tùy chọn)
 * @returns URL endpoint
 */
export function getApiEndpoint(blockchain: BlockchainType, address?: string): string {
  switch (blockchain) {
    case 'BTC':
      return `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`;
      
    case 'ETH':
      return `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${getApiKey(blockchain)}`;
      
    case 'BSC':
      return `https://api.bscscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=${getApiKey(blockchain)}`;
      
    case 'SOL':
      return `https://api.helius.xyz/v0/addresses/${address}/balances?api-key=${getApiKey(blockchain)}`;
      
    case 'DOGE':
      return `https://rest.cryptoapis.io/blockchain-data/doge/mainnet/addresses/${address}/balance?context=yourExampleString`;
      
    default:
      throw new Error(`Không hỗ trợ blockchain: ${blockchain}`);
  }
}

/**
 * Lấy header cần thiết cho API request
 * @param blockchain Loại blockchain
 * @returns Record<string, string> Headers
 */
export function getApiHeaders(blockchain: BlockchainType): Record<string, string> {
  switch (blockchain) {
    case 'DOGE':
      return {
        'Content-Type': 'application/json',
        'X-API-Key': getApiKey(blockchain)
      };
      
    case 'BTC':
    case 'ETH':
    case 'BSC':
    case 'SOL':
    default:
      return {
        'Content-Type': 'application/json'
      };
  }
}