# Báo cáo Cải tiến Cơ chế Xoay vòng API

## Tổng quan

Báo cáo này tóm tắt các thay đổi được thực hiện để cải thiện cơ chế xoay vòng API cho các blockchain Solana và Bitcoin. Những thay đổi này giải quyết các vấn đề về rate limit khi nhiều phiên làm việc cùng một lúc.

## Thay đổi chính

### 1. Chuyển đổi từ cơ chế xoay vòng tuần tự sang ngẫu nhiên

- **Cơ chế cũ**: Xoay vòng tuần tự qua tất cả các API endpoint và key.
- **Cơ chế mới**: Lựa chọn ngẫu nhiên một API endpoint hoặc key từ tất cả các slot có sẵn.

### 2. Giữ nguyên cơ chế slot

- Mỗi API key hoặc public RPC endpoint vẫn được coi là một slot riêng biệt.
- Số slot không thay đổi, chỉ thay đổi cách chọn slot.

### 3. Tăng thời gian timeout

- BlockCypher: Tăng từ 15s lên 30s
- Blockchair: Tăng từ 5s lên 30s
- BTC_Tatum: Giữ nguyên 10s
- Các API khác: Tăng từ 5s lên 15s

## Lợi ích

1. **Phân tán tải**: Giảm xung đột khi nhiều người dùng truy cập cùng một lúc.
2. **Tránh rate limit**: Giảm khả năng các request liên tục được gửi đến cùng một provider.
3. **Khả năng phục hồi tốt hơn**: Khi một API đang bị rate limit, hệ thống sẽ không bị mắc kẹt trong một chuỗi tuần tự.

## Vấn đề còn tồn tại

Dù đã cải thiện đáng kể, một số vấn đề vẫn tồn tại do giới hạn của các dịch vụ bên thứ ba:

1. **GetBlock API**: Thường xuyên trả về lỗi 402 (Payment Required), cho thấy các API key có thể đã hết quota.
2. **Helius API** (Solana): Vẫn thường xuyên bị rate limit (429 Too Many Requests).
3. **BlockCypher**: Thỉnh thoảng vẫn bị rate limit mặc dù đã tăng thời gian timeout và có cơ chế backoff.

## Kiểm thử

Hai tệp kiểm thử đã được tạo để xác nhận hiệu quả của cơ chế mới:
- `test-sol-random-rotation.ts`: Kiểm tra cơ chế ngẫu nhiên cho Solana
- `test-btc-random-rotation.ts`: Kiểm tra cơ chế ngẫu nhiên cho Bitcoin

## Kết luận

Cơ chế xoay vòng ngẫu nhiên đã cải thiện đáng kể khả năng chống chịu của hệ thống khi có nhiều người dùng đồng thời. Tuy nhiên, do giới hạn cố hữu của các dịch vụ API bên thứ ba, vẫn cần tiếp tục theo dõi và cải thiện hệ thống trong tương lai.