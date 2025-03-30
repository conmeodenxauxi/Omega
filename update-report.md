# Báo cáo cập nhật API Bitcoin (BTC)

## Những cập nhật đã thực hiện
1. **Thêm key GetBlock mới**
   - Key mới: `72ac9da16bc4458ca57dfe0dc61fa8b2`
   - Đã thêm vào danh sách key GetBlock trong `server/blockchain/api-keys.ts`
   - Tăng tổng số key GetBlock từ 16 lên 17 key

2. **Cập nhật thông tin giới hạn API**
   - Đã cập nhật thông tin chi tiết trong `btc-api-list.md`
   - Các thông tin giới hạn mới:
     - GetBlock: 5 req/giây/key (17 key = 85 req/giây), 5000 req/ngày/key (85.000 req/ngày)
     - BlockCypher: 3 req/giây/key (9 key = 27 req/giây), 200 req/giờ/key (1.800 req/giờ), 2.000 req/ngày/key (18.000 req/ngày)

3. **Kiểm tra key GetBlock mới**
   - Đã tạo script `test-getblock-new-key.ts` để kiểm tra key mới
   - Kiểm tra với địa chỉ có số dư và không có số dư đều thành công
   - Phản hồi API hoạt động bình thường với trường `balance` như mong đợi

4. **Kiểm tra cơ chế xoay vòng thông minh**
   - Đã tạo script `test-btc-rotation.ts` để kiểm tra
   - Cả 3 địa chỉ kiểm tra đều thành công
   - Các API khác nhau (BlockCypher, GetBlock, Tatum) trả về số dư chính xác
   - Key mới đã được tích hợp thành công vào cơ chế xoay vòng

5. **Tạo báo cáo kiểm tra API key**
   - Đã tạo file `getblock-keys-report.md` để ghi lại kết quả kiểm tra
   - Ghi lại định dạng phản hồi API để tham khảo trong tương lai

## Tổng kết
- Tổng rate limit hiện tại cho Bitcoin: ~184 request/giây (tăng thêm 5 req/giây)
- Tổng giới hạn theo ngày: ~103.000 request/ngày (tăng thêm 5.000 req/ngày)
- API key mới đã hoạt động và tích hợp thành công vào hệ thống xoay vòng
- Hệ thống xoay vòng thông minh cho Bitcoin hoạt động tốt