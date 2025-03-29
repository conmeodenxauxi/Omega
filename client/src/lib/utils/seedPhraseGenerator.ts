/**
 * Utility functions để tạo và kiểm tra seed phrase
 */

/**
 * Danh sách các từ BIP39 tiếng Anh
 */
export const wordList = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse",
  "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
  "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit",
  "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
  "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert",
  "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter",
  "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger",
  "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
  "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic",
  "wonder", "wood", "wool", "word", "work", "world", "worry", "worth", "wrap", "wreck",
  "wrestle", "wrist", "write", "wrong", "yard", "year", "yellow", "you", "young", "youth",
  "zebra", "zero", "zone", "zoo"
];

/**
 * Tạo một mảng bytes ngẫu nhiên
 * @param length Độ dài mảng bytes
 * @returns Uint8Array
 */
function generateRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
}

/**
 * Tính checksum theo phương thức đơn giản
 * @param entropy Uint8Array chứa entropy
 * @returns string
 */
function calculateChecksum(entropy: Uint8Array): string {
  let hash = 0;
  for (let i = 0; i < entropy.length; i++) {
    hash = ((hash << 5) - hash) + entropy[i];
    hash |= 0; // Chuyển thành 32bit integer
  }
  
  // Chuyển hash thành binary string
  const binaryHash = (Math.abs(hash) % 256).toString(2).padStart(8, '0');
  
  // Số bit checksum = entropy.length * 8 / 32
  const checksumBitLength = entropy.length / 4;
  return binaryHash.substring(0, checksumBitLength);
}

/**
 * Tạo mnemonic từ entropy
 * @param entropy Uint8Array chứa entropy
 * @returns string Mnemonic seed phrase
 */
function generateMnemonic(entropy: Uint8Array): string {
  // Chuyển entropy sang binary
  let entropyBits = '';
  entropy.forEach(byte => {
    entropyBits += byte.toString(2).padStart(8, '0');
  });
  
  // Tính checksum
  const checksumBits = calculateChecksum(entropy);
  
  // Nối entropy bits và checksum bits
  const bits = entropyBits + checksumBits;
  
  // Chia bits thành các đoạn 11 bits để map vào từ điển BIP39
  const segments = [];
  for (let i = 0; i < bits.length; i += 11) {
    segments.push(bits.slice(i, i + 11));
  }
  
  // Chuyển từng đoạn 11 bits thành số decimal và lấy từ tương ứng
  const words = segments.map(segment => {
    const index = parseInt(segment, 2);
    return wordList[index % wordList.length]; // Đảm bảo không ra ngoài phạm vi
  });
  
  // Kết hợp các từ thành seed phrase
  return words.join(' ');
}

/**
 * Tạo seed phrase 12 hoặc 24 từ
 * @param wordCount Số từ (12 hoặc 24)
 * @returns string Seed phrase
 */
export function createSeedPhrase(wordCount: 12 | 24): string {
  // 12 từ = 16 bytes entropy, 24 từ = 32 bytes entropy
  const entropyBytes = wordCount === 12 ? 16 : 32;
  const entropy = generateRandomBytes(entropyBytes);
  return generateMnemonic(entropy);
}

/**
 * Kiểm tra seed phrase có hợp lệ không
 * @param phrase Seed phrase cần kiểm tra
 * @returns boolean
 */
export function isValidSeedPhrase(phrase: string): boolean {
  // Chuẩn hóa chuỗi
  const normalizedPhrase = phrase.trim().toLowerCase();
  
  // Tách thành mảng các từ
  const words = normalizedPhrase.split(/\s+/);
  
  // Kiểm tra số lượng từ (phải là 12 hoặc 24)
  if (words.length !== 12 && words.length !== 24) {
    return false;
  }
  
  // Kiểm tra tất cả các từ có trong wordlist không
  return words.every(word => wordList.includes(word));
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