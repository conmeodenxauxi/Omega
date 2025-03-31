# Báo cáo cập nhật hệ thống quản lý rate limit

## Giới thiệu
Tài liệu này mô tả cập nhật về hệ thống quản lý rate limit mới được triển khai trong ứng dụng. Hệ thống này giúp quản lý việc sử dụng các API key và hạn chế các vấn đề rate limit từ các nhà cung cấp API.

## Vấn đề
Trước đây, hệ thống chỉ dựa vào cơ chế xoay vòng tuần tự để lần lượt sử dụng các API key khác nhau. Tuy nhiên, trong trường hợp một số API bị rate limit hoặc quá tải, hệ thống vẫn tiếp tục sử dụng chúng, dẫn đến lỗi liên tục.

## Giải pháp
Đã triển khai hệ thống quản lý rate limit mới (`apiRateLimiter`) với các tính năng:

1. **Quản lý rate limit cho từng API**: Mỗi loại API (Helius, Tatum, BlockCypher...) có cấu hình riêng về số lượng request tối đa trong một khoảng thời gian.

2. **Theo dõi việc sử dụng API key**: Ghi lại việc sử dụng mỗi API key, kiểm tra nếu key đã đạt giới hạn rate limit.

3. **Tìm key khả dụng tự động**: Khi một key bị rate limit, hệ thống tự động tìm key khác còn khả dụng.

4. **Đánh dấu key bị rate limit**: Khi phát hiện HTTP 429 (Too Many Requests) hoặc thông báo rate limit, key sẽ bị đánh dấu là không khả dụng trong một khoảng thời gian (timeout).

5. **Tích hợp với cơ chế xoay vòng hiện có**: Vẫn duy trì cơ chế slot xoay vòng hiện có để đảm bảo các API key được sử dụng đồng đều.

## Các file đã cập nhật

1. **api-rate-limiter.ts**: File mới chứa các lớp và phương thức quản lý rate limit.

2. **api-smart-rotation-btc.ts**: Cập nhật hàm `getNextBitcoinApi` và `checkBitcoinBalance` để tích hợp với hệ thống rate limit mới.

3. **api-smart-rotation-sol.ts**: Đã tích hợp sẵn hệ thống quản lý rate limit.

## Cấu hình Rate Limit

Các cấu hình mặc định đã được thiết lập cho các nhà cung cấp API phổ biến:

| API Type | Giới hạn (requests) | Cửa sổ thời gian (ms) |
|----------|---------------------|----------------------|
| SOL_Helius | 10 | 1000 (1 giây) |
| SOL_Solana-RPC-MainNet | 5 | 1000 (1 giây) |
| BTC_Tatum | 5 | 1000 (1 giây) |
| BTC_BlockCypher | 3 | 1000 (1 giây) |
| BTC_GetBlock | 10 | 1000 (1 giây) |
| BTC_Blockchair | 2 | 1000 (1 giây) |
| ETH_Etherscan | 5 | 1000 (1 giây) |
| BSC_BSCScan | 5 | 1000 (1 giây) |
| DOGE_Tatum | 5 | 1000 (1 giây) |
| DOGE_NowNodes | 5 | 1000 (1 giây) |

## Kiểm tra và xác nhận

Đã tạo script kiểm tra (`test-rate-limiter.ts`) để xác nhận rằng hệ thống rate limit hoạt động đúng với các tính năng:
- Kiểm tra cơ chế rate limit cơ bản
- Kiểm tra tìm key khả dụng
- Kiểm tra đánh dấu key bị rate limit

## Kết luận

Cập nhật này đã cải thiện đáng kể khả năng xử lý rate limit từ các API bên ngoài, giúp hệ thống kiểm tra số dư hoạt động ổn định hơn và tối ưu hóa việc sử dụng các API key có sẵn. Đồng thời, hệ thống vẫn duy trì cơ chế xoay vòng hiện có để đảm bảo việc sử dụng API key đồng đều.