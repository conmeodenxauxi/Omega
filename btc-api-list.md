# Danh sách API và RPC cho Bitcoin

## 1. API Công khai (Không cần API key)

| Tên API | Loại | URL | Giới hạn Yêu cầu | Ghi chú |
|---------|------|-----|-----------------|---------|
| BlockCypher Public | Public | https://api.blockcypher.com/v1/btc/main/addrs/{address}/balance | 3 request/giây, 200 request/giờ | API công khai, không cần API key |
| Blockchair | Public | https://api.blockchair.com/bitcoin/dashboards/address/{address} | 5 request/giây, 1.000 request/ngày | API công khai, không cần API key |

## 2. API Cần API key

### 2.1 BlockCypher (9 API keys)

| API Key | Giới hạn |
|---------|----------|
| bcb10430b01a484c88cd0dede458ab5c | 3 request/giây, 200 request/giờ |
| 11fe78d84a02463a98a5b031b74d42ce | 3 request/giây, 200 request/giờ |
| 40f6118885b14579a8a9b192e362b95f | 3 request/giây, 200 request/giờ |
| 20cfac708c3840aeaf1be8e8e979d309 | 3 request/giây, 200 request/giờ |
| f35a08e245d14504a8b8d291fa37586e | 3 request/giây, 200 request/giờ |
| 1d75a4d512044057b766ca70fe544492 | 3 request/giây, 200 request/giờ |
| 40996bd34dd944788dd3bcff1e8d57b2 | 3 request/giây, 200 request/giờ |
| 2da2cc4c71d94ca79b18bf98a8040612 | 3 request/giây, 200 request/giờ |
| ec575f3135e94d54b105de10c92109c0 | 3 request/giây, 200 request/giờ |

**Tổng giới hạn**: 27 request/giây, 1.800 request/giờ

### 2.2 GetBlock (16 API keys)

| API Key | Giới hạn |
|---------|----------|
| ebbee62f37eb4c89b0acc200e831dcad | 5 request/giây, không giới hạn yêu cầu hàng ngày |
| 053fa1bf9c9643b09e912a0d06795fb7 | 5 request/giây, không giới hạn yêu cầu hàng ngày |
| 6ac4cccd0b7047f0be735acbb6064d5f | 5 request/giây, không giới hạn yêu cầu hàng ngày |
| 0c7f9c191e62464b881018686e181494 | 5 request/giây, không giới hạn yêu cầu hàng ngày |
| c9ed0e0e38474b758aca48a07606be3f | 5 request/giây, không giới hạn yêu cầu hàng ngày |
| 4ce3dd86a29443fdacc7f09f0ff647ca | 5 request/giây, không giới hạn yêu cầu hàng ngày |
| a2273958b2eb418fbcdd59fa660662a8 | 5 request/giây, không giới hạn yêu cầu hàng ngày |
| 24d6f87cf4a24bf590214f369987430a | 5 request/giây, không giới hạn yêu cầu hàng ngày |
| 32b592a03ca2485cb132a65a30c4dd91 | 5 request/giây, không giới hạn yêu cầu hàng ngày |
| ad68799ec77f4c8eab47606b675711c3 | 5 request/giây, không giới hạn yêu cầu hàng ngày |
| 2ec865b2ff584ed4b0694440d0b8da56 | 5 request/giây, không giới hạn yêu cầu hàng ngày |
| 827fb2a6584343298d63cc88f9ff4c8f | 5 request/giây, không giới hạn yêu cầu hàng ngày |
| baae205eee014a09b259d279a4675a2d | 5 request/giây, không giới hạn yêu cầu hàng ngày |
| 565dc71644c540198119e0182d3ecb69 | 5 request/giây, không giới hạn yêu cầu hàng ngày |
| e79207eb887d44139303b8de38301b3e | 5 request/giây, không giới hạn yêu cầu hàng ngày |
| be0fdc9e04254a9fbd1dc2844cdeb208 | 5 request/giây, không giới hạn yêu cầu hàng ngày |

**Tổng giới hạn**: 80 request/giây

### 2.3 Tatum (10 API keys)

| API Key | Giới hạn |
|---------|----------|
| t-67e888a2832893ddeb2bfbce-5c2156d4a3274787897d1e33 | 3 request/giây, không giới hạn yêu cầu hàng ngày |
| t-67e88a6d5953fae328c284f9-5c1d92b1ccd74b1b88dee74a | 3 request/giây, không giới hạn yêu cầu hàng ngày |
| t-67e88dad5953fae328c28507-cace0aa2db32403e979b03b6 | 3 request/giây, không giới hạn yêu cầu hàng ngày |
| t-67e891c09c386072971b6f58-de256a0565b049ce8d537e8e | 3 request/giây, không giới hạn yêu cầu hàng ngày |
| t-67e892fb5953fae328c2850f-a7b5e0f5c750419fbe1b83c2 | 3 request/giây, không giới hạn yêu cầu hàng ngày |
| t-67e8951d5953fae328c28518-72cb0d0d1c534f0aa91cea65 | 3 request/giây, không giới hạn yêu cầu hàng ngày |
| t-67e896559c386072971b6f63-8090b6da562348cfb25aba8e | 3 request/giây, không giới hạn yêu cầu hàng ngày |
| t-67e8975d9c386072971b6f6a-c4763690c181424d9daebb14 | 3 request/giây, không giới hạn yêu cầu hàng ngày |
| t-67e898829c386072971b6f73-569069b90c4843da859a4b9e | 3 request/giây, không giới hạn yêu cầu hàng ngày |
| t-67e8994f832893ddeb2bfbe0-245ad020ff9b445381cac588 | 3 request/giây, không giới hạn yêu cầu hàng ngày |

**Tổng giới hạn**: 30 request/giây

## Tổng giới hạn API cho Bitcoin

| Loại API | Số lượng API keys | Giới hạn tổng |
|----------|-------------------|---------------|
| API công khai | 2 | 8 request/giây |
| BlockCypher | 9 | 27 request/giây |
| GetBlock | 16 | 80 request/giây |
| Tatum | 10 | 30 request/giây |
| **Tổng cộng** | **37** | **145 request/giây** |

## Cơ chế xoay vòng thông minh

Hệ thống sử dụng cơ chế xoay vòng thông minh để tối ưu hóa việc sử dụng các API và tránh vượt quá giới hạn:

1. **Ưu tiên API ít sử dụng nhất**: Hệ thống theo dõi số lần sử dụng mỗi API và ưu tiên chọn API có số lần gọi ít nhất.
2. **Xoay vòng API key**: Mỗi API provider có nhiều API key và hệ thống xoay vòng giữa các key để tối đa hóa lưu lượng.
3. **Kết hợp API công khai và cần key**: Hệ thống luân phiên giữa API công khai và API cần key để tối ưu hóa việc sử dụng.
4. **Circuit breaker**: Nếu một API gặp lỗi nhiều lần, hệ thống sẽ tạm thời ngừng sử dụng API đó để tránh gây thêm lỗi.

Với cơ chế này và số lượng API key hiện có, hệ thống có thể xử lý đồng thời 145 yêu cầu mỗi giây cho Bitcoin, giúp ứng dụng hoạt động mượt mà ngay cả khi có nhiều người dùng đồng thời.