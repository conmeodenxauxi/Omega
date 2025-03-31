# Web3 Wallet Security Platform

Nền tảng bảo mật ví Web3 nâng cao với khả năng giám sát mạng đa blockchain thông minh và xử lý hàng loạt động, có tính năng quản lý kết nối mạnh mẽ và cơ chế khôi phục.

## Công nghệ cốt lõi
- Backend được xây dựng bằng TypeScript
- Cơ sở dữ liệu SQLite với tạo bảng tự động
- Hệ thống giám sát địa chỉ đa blockchain
- Xoay vòng API nâng cao với cơ chế dự phòng
- Thiết kế UI responsive với Tailwind CSS
- Cơ sở hạ tầng theo dõi số dư blockchain toàn diện
- Xử lý song song nâng cao cho kiểm tra blockchain đồng thời
- Hệ thống phục hồi kết nối và kiểm tra sức khỏe tinh vi

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Khởi chạy ứng dụng ở chế độ phát triển
npm run dev

# Build ứng dụng cho production
npm run build

# Chạy ứng dụng ở chế độ production
npm run start
```

## Biến môi trường

Ứng dụng sử dụng các biến môi trường sau:

- `DATABASE_URL`: Đường dẫn đến cơ sở dữ liệu PostgreSQL (nếu sử dụng)
- `NODE_ENV`: Môi trường chạy ứng dụng (development/production)

## API Endpoints

- `/api/health`: Kiểm tra trạng thái hoạt động của ứng dụng
- `/api/generate-addresses`: Tạo địa chỉ từ seed phrase
- `/api/check-balances`: Kiểm tra số dư ví
- `/api/check-balances-parallel`: Kiểm tra số dư ví song song
- `/api/admin/query-wallets`: Truy vấn ví với số dư
- `/api/admin/clear-database`: Xóa dữ liệu database