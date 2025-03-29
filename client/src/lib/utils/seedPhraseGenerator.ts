/**
 * Utility functions để tạo và kiểm tra seed phrase
 * Sử dụng thư viện bip39 để đảm bảo tuân thủ đúng chuẩn BIP39
 */
import * as bip39 from 'bip39';

/**
 * Danh sách các từ BIP39 tiếng Anh
 */
export const wordList = bip39.wordlists.english;

/**
 * Tạo seed phrase 12 hoặc 24 từ theo chuẩn BIP39
 * @param wordCount Số từ (12 hoặc 24)
 * @returns string Seed phrase hợp lệ
 */
export function createSeedPhrase(wordCount: 12 | 24): string {
  // 12 từ = 128 bits entropy, 24 từ = 256 bits entropy
  const strength = wordCount === 12 ? 128 : 256;
  return bip39.generateMnemonic(strength);
}

/**
 * Kiểm tra seed phrase có hợp lệ không theo chuẩn BIP39
 * @param phrase Seed phrase cần kiểm tra
 * @returns boolean
 */
export function isValidSeedPhrase(phrase: string): boolean {
  // Chuẩn hóa chuỗi
  const normalizedPhrase = phrase.trim().toLowerCase();
  
  // Sử dụng thư viện bip39 để kiểm tra hợp lệ
  return bip39.validateMnemonic(normalizedPhrase);
}

/**
 * Tính điểm mạnh yếu của seed phrase
 * @param phrase Seed phrase cần đánh giá
 * @returns number (0-100)
 */
export function calculateSeedPhraseStrength(phrase: string): number {
  if (!isValidSeedPhrase(phrase)) {
    return 0;
  }
  
  const words = phrase.trim().toLowerCase().split(/\s+/);
  
  // 24 từ mạnh hơn 12 từ
  let strength = words.length === 24 ? 100 : 80;
  
  // Kiểm tra các từ lặp lại
  const uniqueWords = new Set(words);
  if (uniqueWords.size < words.length) {
    // Trừ điểm nếu có từ lặp lại
    const duplicateCount = words.length - uniqueWords.size;
    strength -= duplicateCount * 10;
  }
  
  // Kiểm tra các từ liên tiếp trong wordlist
  for (let i = 0; i < words.length - 1; i++) {
    const currentIndex = wordList.indexOf(words[i]);
    const nextIndex = wordList.indexOf(words[i + 1]);
    
    if (nextIndex - currentIndex === 1) {
      // Trừ điểm nếu có từ liên tiếp trong wordlist
      strength -= 5;
    }
  }
  
  // Đảm bảo điểm trong khoảng 0-100
  return Math.max(0, Math.min(100, strength));
}

/**
 * Đánh giá độ mạnh của seed phrase
 * @param phrase Seed phrase cần đánh giá
 * @returns {strength: number, description: string}
 */
export function evaluateSeedPhrase(phrase: string): { strength: number; description: string } {
  const strength = calculateSeedPhraseStrength(phrase);
  
  let description = '';
  
  if (strength >= 90) {
    description = 'Rất mạnh';
  } else if (strength >= 75) {
    description = 'Mạnh';
  } else if (strength >= 50) {
    description = 'Trung bình';
  } else if (strength >= 25) {
    description = 'Yếu';
  } else {
    description = 'Rất yếu';
  }
  
  return { strength, description };
}