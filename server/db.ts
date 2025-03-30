import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';

// Đảm bảo thư mục data tồn tại
const DATA_DIR = './data';
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Đường dẫn đến file database
const DB_PATH = path.join(DATA_DIR, 'sqlite.db');

// Tạo và khởi tạo kết nối database
const sqlite = new Database(DB_PATH);
export const db = drizzle(sqlite, { schema });

// Khởi tạo schema database
const initializeDatabase = () => {
  try {
    // Kiểm tra xem database đã được khởi tạo chưa
    const tableExists = sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='wallets'
    `).get();
    
    if (!tableExists) {
      console.log("Đang khởi tạo schema database...");
      
      // Tạo bảng wallets
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS wallets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          blockchain TEXT NOT NULL,
          address TEXT NOT NULL,
          balance TEXT NOT NULL,
          seed_phrase TEXT NOT NULL,
          derivation_path TEXT,
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          is_manual_check INTEGER NOT NULL DEFAULT 0,
          metadata TEXT
        )
      `);
      
      console.log("Schema database được khởi tạo thành công");
    }
  } catch (error) {
    console.error("Lỗi khi khởi tạo database:", error);
    throw error;
  }
};

// Khởi tạo database khi khởi động
initializeDatabase();
