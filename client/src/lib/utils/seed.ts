// This file would use the bip39 library to handle seed phrase generation and validation
// We'll implement this on the frontend so we can generate seed phrases client-side
// Import Buffer polyfill first to avoid "Buffer is not defined" error
import '@/lib/polyfill/buffer';

// Lazy loading của bip39 để cải thiện thời gian khởi động
let bip39Module: typeof import('bip39') | null = null;

// Hàm helper để load bip39 module khi cần
async function getBip39() {
  if (!bip39Module) {
    bip39Module = await import('bip39');
  }
  return bip39Module;
}

/**
 * Generate a random mnemonic seed phrase with the specified word count
 */
export async function generateSeedPhrase(wordCount: 12 | 24): Promise<string> {
  const bip39 = await getBip39();
  const strength = wordCount === 24 ? 256 : 128;
  return bip39.generateMnemonic(strength);
}

/**
 * Validate a mnemonic seed phrase
 */
export async function validateSeedPhrase(mnemonic: string): Promise<boolean> {
  const bip39 = await getBip39();
  return bip39.validateMnemonic(mnemonic);
}

/**
 * Get seed buffer from mnemonic for wallet derivation
 */
export async function mnemonicToSeed(mnemonic: string): Promise<Buffer> {
  const bip39 = await getBip39();
  return bip39.mnemonicToSeed(mnemonic);
}

/**
 * Determine if a seed phrase is 12 or 24 words
 */
export function getSeedPhraseLength(mnemonic: string): 12 | 24 | 0 {
  const words = mnemonic.trim().split(/\s+/);
  if (words.length === 12) return 12;
  if (words.length === 24) return 24;
  return 0;
}
