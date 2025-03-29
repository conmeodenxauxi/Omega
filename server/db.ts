import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';

// Ensure the data directory exists
const DATA_DIR = './data';
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database file path
const DB_PATH = path.join(DATA_DIR, 'sqlite.db');

// Create and initialize database connection
const sqlite = new Database(DB_PATH);
export const db = drizzle(sqlite, { schema });

// Initialize database schema
const initializeDatabase = () => {
  try {
    // Check if the database has been initialized
    const tableExists = sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='wallets'
    `).get();
    
    if (!tableExists) {
      console.log("Initializing database schema...");
      
      // Create users table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL
        )
      `);
      
      // Create wallets table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS wallets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          blockchain TEXT NOT NULL,
          address TEXT NOT NULL,
          balance TEXT NOT NULL,
          seed_phrase TEXT NOT NULL,
          derivation_path TEXT,
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          metadata TEXT
        )
      `);
      
      console.log("Database schema initialized successfully");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

// Initialize the database on startup
initializeDatabase();
