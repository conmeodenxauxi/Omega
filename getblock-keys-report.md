# Báo cáo kiểm tra API key GetBlock

## Kiểm tra key mới ngày 30/03/2025
Key: 72ac9da16bc4458ca57dfe0dc61fa8b2

### Kết quả kiểm tra:
1. Kiểm tra với địa chỉ BTC có số dư (1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ):
   - ✅ Thành công
   - Số dư: 0.02293899 BTC

2. Kiểm tra với địa chỉ BTC đặc biệt (1BitcoinEaterAddressDontSendf59kuE):
   - ✅ Thành công
   - Số dư: 13.35970717 BTC

### Thông tin định dạng phản hồi:
```json
{
  "address": "1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ",
  "balance": "2293899",
  "totalReceived": "24191477829744",
  "totalSent": "24191475535845",
  "unconfirmedBalance": "0",
  "unconfirmedTxs": 0,
  "txs": 865
}
```

## Thông tin giới hạn API GetBlock
- Số lượng API key: 17
- Rate limit: 5 request/giây/key = 85 request/giây
- Giới hạn theo ngày: 5.000 request/ngày/key = 85.000 request/ngày

## Kết luận
Key GetBlock mới đã được kiểm tra và hoạt động tốt. Đã cập nhật vào hệ thống xoay vòng API thông minh.