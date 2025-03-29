-- Thêm cột source vào bảng wallets nếu chưa tồn tại
ALTER TABLE wallets ADD COLUMN source TEXT DEFAULT 'auto';

-- Tạo bảng manual_checks nếu chưa tồn tại
CREATE TABLE manual_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seed_phrase TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT DEFAULT '{}'
);