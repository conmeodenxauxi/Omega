/**
 * Polyfill cho Buffer trong môi trường trình duyệt
 */
import { Buffer as BufferPolyfill } from 'buffer';

// Thêm Buffer vào global scope để bip39 có thể sử dụng
if (typeof window !== 'undefined') {
  (window as any).Buffer = BufferPolyfill;
}

export { BufferPolyfill as Buffer };