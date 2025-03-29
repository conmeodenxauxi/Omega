import { BlockchainType } from "@shared/schema";
import * as bip39 from "bip39";
import * as bitcoin from "bitcoinjs-lib";
import { ethers } from "ethers";
import { derivePath } from "ed25519-hd-key";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { BLOCKCHAIN_PATHS } from "../../client/src/lib/utils/blockchains";
import { WalletAddress } from "../../client/src/types";

// Generate HD wallet master key from mnemonic
export async function getMasterKeyFromMnemonic(mnemonic: string): Promise<Buffer> {
  return await bip39.mnemonicToSeed(mnemonic);
}

// Generate Bitcoin addresses (Legacy, SegWit, and Native SegWit)
export function generateBitcoinAddresses(masterSeed: Buffer, startIndex: number = 0, count: number = 5): WalletAddress[] {
  const results: WalletAddress[] = [];
  
  // Setup networks
  const network = bitcoin.networks.bitcoin;
  
  // Generate root HD node
  const root = bitcoin.bip32.fromSeed(masterSeed, network);
  
  // Create batch of legacy addresses (m/44'/0'/0'/0/x)
  const legacyAddresses: string[] = [];
  for (let i = startIndex; i < startIndex + count; i++) {
    const path = BLOCKCHAIN_PATHS.BTC.legacy + i;
    const child = root.derivePath(path);
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: child.publicKey,
      network 
    });
    if (address) legacyAddresses.push(address);
  }
  
  // Create batch of SegWit addresses (m/49'/0'/0'/0/x)
  const segwitAddresses: string[] = [];
  for (let i = startIndex; i < startIndex + count; i++) {
    const path = BLOCKCHAIN_PATHS.BTC.segwit + i;
    const child = root.derivePath(path);
    const { address } = bitcoin.payments.p2sh({ 
      redeem: bitcoin.payments.p2wpkh({ 
        pubkey: child.publicKey,
        network 
      }),
      network 
    });
    if (address) segwitAddresses.push(address);
  }
  
  // Create batch of Native SegWit addresses (m/84'/0'/0'/0/x)
  const nativeSegwitAddresses: string[] = [];
  for (let i = startIndex; i < startIndex + count; i++) {
    const path = BLOCKCHAIN_PATHS.BTC.nativeSegwit + i;
    const child = root.derivePath(path);
    const { address } = bitcoin.payments.p2wpkh({ 
      pubkey: child.publicKey,
      network 
    });
    if (address) nativeSegwitAddresses.push(address);
  }
  
  // Add legacy addresses to results
  if (legacyAddresses.length > 0) {
    results.push({
      blockchain: "BTC",
      type: "Legacy Addresses (Batch)",
      batchNumber: 1,
      addresses: legacyAddresses
    });
  }
  
  // Add SegWit addresses to results
  if (segwitAddresses.length > 0) {
    results.push({
      blockchain: "BTC",
      type: "SegWit Addresses (Batch)",
      batchNumber: 1,
      addresses: segwitAddresses
    });
  }
  
  // Add Native SegWit addresses to results
  if (nativeSegwitAddresses.length > 0) {
    results.push({
      blockchain: "BTC",
      type: "Native SegWit Addresses (Batch)",
      batchNumber: 1,
      addresses: nativeSegwitAddresses
    });
  }
  
  return results;
}

// Generate Ethereum and BSC addresses (they use the same derivation path)
export function generateEthereumAddresses(masterSeed: Buffer, blockchain: "ETH" | "BSC", startIndex: number = 0, count: number = 3): WalletAddress {
  const addresses: string[] = [];
  
  const hdNode = ethers.HDNodeWallet.fromSeed(masterSeed);
  
  // Generate Ethereum/BSC addresses (m/44'/60'/0'/0/x)
  for (let i = startIndex; i < startIndex + count; i++) {
    const path = `${BLOCKCHAIN_PATHS.ETH}${i}`;
    const wallet = hdNode.derivePath(path);
    addresses.push(wallet.address);
  }
  
  return {
    blockchain,
    batchNumber: 1,
    addresses
  };
}

// Generate Solana addresses
export function generateSolanaAddresses(masterSeed: Buffer, startIndex: number = 0, count: number = 3): WalletAddress {
  const addresses: string[] = [];
  
  // Generate Solana addresses (m/44'/501'/0'/0/x)
  for (let i = startIndex; i < startIndex + count; i++) {
    const path = `${BLOCKCHAIN_PATHS.SOL}${i}`;
    const { key } = derivePath(path, masterSeed.toString("hex"));
    const keypair = nacl.sign.keyPair.fromSeed(key.slice(0, 32));
    const address = bs58.encode(keypair.publicKey);
    addresses.push(address);
  }
  
  return {
    blockchain: "SOL",
    batchNumber: 1,
    addresses
  };
}

// Generate Dogecoin addresses
export function generateDogecoinAddresses(masterSeed: Buffer, startIndex: number = 0, count: number = 3): WalletAddress {
  const addresses: string[] = [];
  
  // Setup networks - use bitcoin.networks.bitcoin but customize for Dogecoin
  const network = {
    ...bitcoin.networks.bitcoin,
    wif: 0x9e,
    bip32: {
      public: 0x02facafd,
      private: 0x02fac398,
    },
  };
  
  const root = bitcoin.bip32.fromSeed(masterSeed, network);
  
  // Generate Dogecoin addresses (m/44'/3'/0'/0/x)
  for (let i = startIndex; i < startIndex + count; i++) {
    const path = `${BLOCKCHAIN_PATHS.DOGE}${i}`;
    const child = root.derivePath(path);
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: child.publicKey,
      network 
    });
    if (address) addresses.push(address);
  }
  
  return {
    blockchain: "DOGE",
    batchNumber: 1,
    addresses
  };
}

// Generate addresses for all blockchain types from a seed phrase
export async function generateAddressesFromSeedPhrase(
  seedPhrase: string,
  blockchains: BlockchainType[]
): Promise<WalletAddress[]> {
  const masterSeed = await getMasterKeyFromMnemonic(seedPhrase);
  const addresses: WalletAddress[] = [];
  
  // Generate addresses for each selected blockchain
  for (const blockchain of blockchains) {
    switch (blockchain) {
      case "BTC":
        addresses.push(...generateBitcoinAddresses(masterSeed));
        break;
      case "ETH":
        addresses.push(generateEthereumAddresses(masterSeed, "ETH"));
        break;
      case "BSC":
        addresses.push(generateEthereumAddresses(masterSeed, "BSC"));
        break;
      case "SOL":
        addresses.push(generateSolanaAddresses(masterSeed));
        break;
      case "DOGE":
        addresses.push(generateDogecoinAddresses(masterSeed));
        break;
    }
  }
  
  return addresses;
}
