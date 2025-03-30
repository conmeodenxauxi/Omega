# Báo cáo kiểm tra API key từ NowNodes.io

## Tổng quan

API key: `2bef078b-8ab5-41f6-bccb-0d900fe6507b`

## Kết quả kiểm tra

### Bitcoin (BTC)

- **Trạng thái API**: ✅ Hoạt động
- **Root endpoint**: ✅ Trả về dữ liệu về phiên bản và trạng thái blockchain
- **Địa chỉ cụ thể**: ⚠️ Phản hồi quá lớn, nhưng có vẻ hoạt động
- **Giới hạn yêu cầu**: ⚠️ Phát hiện giới hạn request (trả về số lượng lớn dữ liệu)

### Dogecoin (DOGE)

- **Trạng thái API**: ✅ Hoạt động
- **Root endpoint**: ✅ Trả về dữ liệu về phiên bản và trạng thái blockchain
- **Địa chỉ cụ thể**: ⚠️ Phát hiện giới hạn yêu cầu, phản hồi không hoàn thành
- **Giới hạn yêu cầu**: ❌ "Too many requests per second. Use Pro plan to avoid limitations"

## Phân tích

1. **API hoạt động**: API NowNodes.io hoạt động cho cả Bitcoin và Dogecoin, nhưng có giới hạn yêu cầu nghiêm ngặt.
  
2. **Định dạng API**:
   - Endpoint chính là `https://btcbook.nownodes.io/api/` cho Bitcoin và `https://dogebook.nownodes.io/api/` cho Dogecoin
   - API hỗ trợ định dạng v1 (`/api/address/{address}`) và v2 (`/api/v2/address/{address}`)

3. **Giới hạn yêu cầu**:
   - Phản hồi cho Bitcoin trả về một lượng lớn dữ liệu khi truy vấn địa chỉ
   - Dogecoin API đạt giới hạn yêu cầu rất nhanh (1 yêu cầu/giây) và yêu cầu nâng cấp lên gói Pro

## Kết luận và đề xuất

1. **Giá trị sử dụng trong ứng dụng hiện tại**: ⚠️ **KHÔNG NÊN TRIỂN KHAI**
   - API có giới hạn yêu cầu quá nghiêm ngặt cho phiên bản miễn phí, đặc biệt với Dogecoin
   - Các API trả về quá nhiều dữ liệu ở một số trường hợp, có thể gây lãng phí băng thông

2. **Đề xuất**:
   - Tiếp tục sử dụng các API đang có sẵn (Tatum, BlockCypher, GetBlock)
   - Chỉ thêm NowNodes vào hệ thống nếu nâng cấp lên gói Pro (hoặc có key trả phí)
   - Nếu sử dụng, cần giới hạn tần suất yêu cầu (không quá 1 req/giây) và xử lý lỗi rate limit

## So sánh với API khác

| API | BTC Req/Giây | DOGE Req/Giây | Ưu điểm | Nhược điểm |
|-----|--------------|---------------|---------|------------|
| NowNodes Free | 1 | <1 | API giao tiếp đơn giản | Giới hạn req rất thấp |
| Tatum | 3 | 3 | Ổn định, tương thích cao | Trả về ít dữ liệu hơn |
| BlockCypher | 3 | 3 | Nhanh, dễ phân tích | Giới hạn 200 req/giờ |
| GetBlock | 5 | 5 | Không giới hạn tổng req | Phản hồi chậm hơn |