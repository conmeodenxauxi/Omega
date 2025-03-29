import * as bip39 from 'bip39';

export class SeedPhraseGenerator {
  // Tạo một seed phrase mới với số từ xác định (12 hoặc 24)
  static generate(wordCount: 12 | 24 = 12): string {
    // Tạo entropy ngẫu nhiên với độ dài phù hợp (16 bytes cho 12 từ, 32 bytes cho 24 từ)
    const entropy = wordCount === 12 ? 
      crypto.getRandomValues(new Uint8Array(16)) : 
      crypto.getRandomValues(new Uint8Array(32));
    
    // Chuyển đổi entropy thành seed phrase theo chuẩn BIP39
    return bip39.entropyToMnemonic(Buffer.from(entropy));
  }
  
  // Kiểm tra tính hợp lệ của seed phrase
  static validate(phrase: string): boolean {
    return bip39.validateMnemonic(phrase);
  }
}