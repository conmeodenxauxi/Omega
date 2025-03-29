import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { ethers } from 'ethers';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as ecpair from 'ecpair';
import * as ed25519HdKey from "ed25519-hd-key";
import { WalletAddress, BlockchainType } from "@shared/schema";

// Hàm helper encode/decode bs58
function bs58Encode(data: Buffer | Uint8Array): string {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return bs58.encode(buffer);
}

// Đơn giản hóa để giảm lỗi kiểu dữ liệu
const createSolanaKeypair = (seedBytes: Buffer, index: number) => {
  try {
    const path = `m/44'/501'/${index}'/0'`;
    const derivedKey = ed25519HdKey.derivePath(path, seedBytes.toString('hex'));
    if (!derivedKey || !derivedKey.key) {
      throw new Error('Failed to derive Solana key');
    }
    const keyPair = nacl.sign.keyPair.fromSeed(new Uint8Array(derivedKey.key.slice(0, 32)));
    return keyPair;
  } catch (error) {
    console.error('Error creating Solana keypair:', error);
    return nacl.sign.keyPair();
  }
};

// BIP32 factory
const bip32 = BIP32Factory(ecc);

// ECPair factory
const ECPair = ecpair.ECPairFactory(ecc);

// Loại địa chỉ Bitcoin
export enum BTCAddressType {
  LEGACY = 'legacy', // Địa chỉ bắt đầu bằng '1'
  SEGWIT = 'segwit', // Địa chỉ bắt đầu bằng '3'
  NATIVE_SEGWIT = 'native-segwit' // Địa chỉ bắt đầu bằng 'bc1'
}

// Derivation paths theo chuẩn BIP
const DERIVATION_PATHS = {
  [BTCAddressType.LEGACY]: "m/44'/0'/0'/0/0",
  [BTCAddressType.SEGWIT]: "m/49'/0'/0'/0/0",
  [BTCAddressType.NATIVE_SEGWIT]: "m/84'/0'/0'/0/0",
  ETH: "m/44'/60'/0'/0/0",
  BSC: "m/44'/60'/0'/0/0", // BSC dùng path giống ETH
  DOGE: "m/44'/3'/0'/0/0",
  SOL: "m/44'/501'/0'/0'"
};

// Cấu hình network cho Dogecoin
const DOGECOIN_NETWORK = {
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  bech32: 'dc',
  bip32: {
    public: 0x02facafd,
    private: 0x02fac398
  },
  pubKeyHash: 0x1e,
  scriptHash: 0x16,
  wif: 0x9e
};

/**
 * Tạo địa chỉ Bitcoin từ seed phrase
 */
export async function createBTCAddress(seedPhrase: string, type: BTCAddressType = BTCAddressType.NATIVE_SEGWIT, index = 0): Promise<string> {
  try {
    // 1. Chuyển seed phrase thành seed bytes
    const seed = await bip39.mnemonicToSeed(seedPhrase);
    
    // 2. Tạo HD wallet root từ seed
    const root = bip32.fromSeed(seed);
    
    // 3. Lấy derivation path phù hợp với loại địa chỉ (thay đổi index nếu cần)
    const customPath = DERIVATION_PATHS[type].replace(/\/0$/, `/${index}`);
    
    // 4. Tạo key từ derivation path
    const child = root.derivePath(customPath);
    
    // 5. Tạo ECPair từ private key
    const keyPair = ECPair.fromPrivateKey(child.privateKey);
    
    // 6. Tạo địa chỉ tương ứng với loại được chọn
    let address;
    switch(type) {
      case BTCAddressType.LEGACY: // Địa chỉ bắt đầu bằng '1'
        address = bitcoin.payments.p2pkh({
          pubkey: Buffer.from(keyPair.publicKey),
          network: bitcoin.networks.bitcoin
        }).address;
        break;
      case BTCAddressType.SEGWIT: // Địa chỉ bắt đầu bằng '3'
        address = bitcoin.payments.p2sh({
          redeem: bitcoin.payments.p2wpkh({ 
            pubkey: Buffer.from(keyPair.publicKey),
            network: bitcoin.networks.bitcoin 
          }),
          network: bitcoin.networks.bitcoin
        }).address;
        break;
      case BTCAddressType.NATIVE_SEGWIT: // Địa chỉ bắt đầu bằng 'bc1'
        address = bitcoin.payments.p2wpkh({
          pubkey: Buffer.from(keyPair.publicKey),
          network: bitcoin.networks.bitcoin
        }).address;
        break;
      default:
        throw new Error(`Unsupported BTC address type: ${type}`);
    }
    
    return address || '';
  } catch (error) {
    console.error('Error creating BTC address:', error);
    return '';
  }
}

/**
 * Tạo nhiều địa chỉ Bitcoin từ một seed phrase
 */
export async function createBTCAddresses(seedPhrase: string, batchNumber: number = 0, count: number = 5): Promise<WalletAddress> {
  try {
    const startIndex = batchNumber * count;
    const addresses: string[] = [];
    
    // Tạo mỗi loại địa chỉ
    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      
      // Legacy address
      const legacyAddress = await createBTCAddress(seedPhrase, BTCAddressType.LEGACY, index);
      if (legacyAddress) addresses.push(legacyAddress);
      
      // SegWit address
      const segwitAddress = await createBTCAddress(seedPhrase, BTCAddressType.SEGWIT, index);
      if (segwitAddress) addresses.push(segwitAddress);
      
      // Native SegWit address
      const nativeSegwitAddress = await createBTCAddress(seedPhrase, BTCAddressType.NATIVE_SEGWIT, index);
      if (nativeSegwitAddress) addresses.push(nativeSegwitAddress);
    }
    
    return {
      blockchain: "BTC",
      type: "mixed",
      batchNumber,
      addresses
    };
  } catch (error) {
    console.error('Error creating BTC addresses:', error);
    return {
      blockchain: "BTC",
      type: "mixed",
      batchNumber,
      addresses: []
    };
  }
}

/**
 * Tạo địa chỉ Ethereum hoặc BSC từ seed phrase
 */
export async function createETHAddress(seedPhrase: string, blockchain: "ETH" | "BSC" = "ETH", index = 0): Promise<string> {
  try {
    // Tạo wallet từ seed phrase
    const hdNode = ethers.HDNodeWallet.fromPhrase(seedPhrase);
    
    // Dẫn xuất đường dẫn với index
    const path = `m/44'/60'/0'/0/${index}`;
    const derivedNode = hdNode.derivePath(path);
    
    return derivedNode.address;
  } catch (error) {
    console.error(`Error creating ${blockchain} address:`, error);
    return '';
  }
}

/**
 * Tạo nhiều địa chỉ Ethereum hoặc BSC từ một seed phrase
 */
export async function createETHAddresses(seedPhrase: string, blockchain: "ETH" | "BSC" = "ETH", batchNumber: number = 0, count: number = 3): Promise<WalletAddress> {
  try {
    const startIndex = batchNumber * count;
    const addresses: string[] = [];
    
    // Tạo các địa chỉ với index khác nhau
    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      const address = await createETHAddress(seedPhrase, blockchain, index);
      if (address) addresses.push(address);
    }
    
    return {
      blockchain: blockchain as BlockchainType,
      type: "address",
      batchNumber,
      addresses
    };
  } catch (error) {
    console.error(`Error creating ${blockchain} addresses:`, error);
    return {
      blockchain: blockchain as BlockchainType,
      type: "address",
      batchNumber,
      addresses: []
    };
  }
}

/**
 * Tạo địa chỉ Solana từ seed phrase
 */
export async function createSOLAddress(seedPhrase: string, index = 0): Promise<string> {
  try {
    // Chuyển seed phrase thành seed bytes
    const seed = await bip39.mnemonicToSeed(seedPhrase);
    
    // Sử dụng hàm helper đã được định nghĩa
    const keypair = createSolanaKeypair(seed, index);
    
    // Chuyển đổi public key thành chuỗi base58
    const address = bs58Encode(Buffer.from(keypair.publicKey));
    
    return address;
  } catch (error) {
    console.error('Error creating SOL address:', error);
    return '';
  }
}

/**
 * Tạo nhiều địa chỉ Solana từ một seed phrase
 */
export async function createSOLAddresses(seedPhrase: string, batchNumber: number = 0, count: number = 3): Promise<WalletAddress> {
  try {
    const startIndex = batchNumber * count;
    const addresses: string[] = [];
    
    // Tạo các địa chỉ với index khác nhau
    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      const address = await createSOLAddress(seedPhrase, index);
      if (address) addresses.push(address);
    }
    
    return {
      blockchain: "SOL",
      type: "address",
      batchNumber,
      addresses
    };
  } catch (error) {
    console.error('Error creating SOL addresses:', error);
    return {
      blockchain: "SOL",
      type: "address",
      batchNumber,
      addresses: []
    };
  }
}

/**
 * Tạo địa chỉ Dogecoin từ seed phrase
 */
export async function createDOGEAddress(seedPhrase: string, index = 0): Promise<string> {
  try {
    // Chuyển seed phrase thành seed bytes
    const seed = await bip39.mnemonicToSeed(seedPhrase);
    
    // Tạo HD wallet root từ seed
    const root = bip32.fromSeed(seed);
    
    // Sử dụng derivation path đặc biệt cho Dogecoin
    const path = `m/44'/3'/0'/0/${index}`;
    const child = root.derivePath(path);
    
    // Tạo ECPair từ private key
    const keyPair = ECPair.fromPrivateKey(child.privateKey);
    
    // Tạo địa chỉ Dogecoin sử dụng cấu hình network đặc biệt
    const address = bitcoin.payments.p2pkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network: DOGECOIN_NETWORK
    }).address;
    
    return address || '';
  } catch (error) {
    console.error('Error creating DOGE address:', error);
    return '';
  }
}

/**
 * Tạo nhiều địa chỉ Dogecoin từ một seed phrase
 */
export async function createDOGEAddresses(seedPhrase: string, batchNumber: number = 0, count: number = 3): Promise<WalletAddress> {
  try {
    const startIndex = batchNumber * count;
    const addresses: string[] = [];
    
    // Tạo các địa chỉ với index khác nhau
    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      const address = await createDOGEAddress(seedPhrase, index);
      if (address) addresses.push(address);
    }
    
    return {
      blockchain: "DOGE",
      type: "address",
      batchNumber,
      addresses
    };
  } catch (error) {
    console.error('Error creating DOGE addresses:', error);
    return {
      blockchain: "DOGE",
      type: "address",
      batchNumber,
      addresses: []
    };
  }
}

/**
 * Tạo địa chỉ trên các blockchain từ seed phrase
 */
export async function generateAddressesFromSeedPhrase(
  seedPhrase: string,
  blockchains: BlockchainType[],
  batchNumber: number = 0
): Promise<WalletAddress[]> {
  const walletAddresses: WalletAddress[] = [];
  
  try {
    const promises = blockchains.map(async (blockchain) => {
      switch (blockchain) {
        case "BTC":
          return await createBTCAddresses(seedPhrase, batchNumber);
        case "ETH":
          return await createETHAddresses(seedPhrase, "ETH", batchNumber);
        case "BSC":
          return await createETHAddresses(seedPhrase, "BSC", batchNumber);
        case "SOL":
          return await createSOLAddresses(seedPhrase, batchNumber);
        case "DOGE":
          return await createDOGEAddresses(seedPhrase, batchNumber);
        default:
          throw new Error(`Unsupported blockchain type: ${blockchain}`);
      }
    });
    
    const results = await Promise.all(promises);
    return results.filter(wallet => wallet.addresses.length > 0);
  } catch (error) {
    console.error('Error generating addresses from seed phrase:', error);
    return walletAddresses;
  }
}