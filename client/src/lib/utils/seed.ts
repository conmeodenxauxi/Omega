// This file would use the bip39 library to handle seed phrase generation and validation
// We'll implement this on the frontend so we can generate seed phrases client-side
// Import Buffer polyfill first to avoid "Buffer is not defined" error
import '@/lib/polyfill/buffer';
import * as bip39 from 'bip39';

/**
 * Generate a random mnemonic seed phrase with the specified word count
 */
export function generateSeedPhrase(wordCount: 12 | 24): string {
  const strength = wordCount === 24 ? 256 : 128;
  return bip39.generateMnemonic(strength);
}

/**
 * Validate a mnemonic seed phrase
 */
export function validateSeedPhrase(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

/**
 * Get seed buffer from mnemonic for wallet derivation
 */
export function mnemonicToSeed(mnemonic: string): Promise<Buffer> {
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
