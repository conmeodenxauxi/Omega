# Danh sách API cho Bitcoin (BTC)

## Rate Limits và Thông tin API

### BlockCypher
- **Số lượng API key**: 9
- **Rate limit**: 3 req/giây/key = 27 req/giây
- **Giới hạn hàng giờ**: 200 req/giờ/key = 1800 req/giờ
- **Giới hạn hàng ngày**: 2000 req/ngày/key = 18000 req/ngày
- **Mô tả**: Private API cho Bitcoin

### GetBlock
- **Số lượng API key**: 17
- **Rate limit**: 5 req/giây/key = 85 req/giây
- **Giới hạn hàng ngày**: 5000 req/ngày/key = 85.000 req/ngày
- **Mô tả**: Private API cho Bitcoin

### Tatum
- **Số lượng API key**: 15 (10 key cũ + 5 key mới)
- **Rate limit**: 3 req/giây/key = 45 req/giây
- **Mô tả**: Private API cho Bitcoin, yêu cầu sử dụng API key trong header

### Public APIs
- **Blockchair**: 10 req/giây
- **Blockchain.info**: 1-3 req/giây
- **Blockstream**: 5 req/giây
- **SoChain**: 2-3 req/giây
- **Mempool.space**: 3-5 req/giây

## Tổng rate limit hiện tại cho Bitcoin
- **Tổng cộng**: ~184 request/giây

---

# Danh sách API cho Dogecoin (DOGE)

## Rate Limits và Thông tin API

### Tatum
- **Số lượng API key**: 15
- **Rate limit**: 3 req/giây/key = 45 req/giây
- **Mô tả**: Private API cho Dogecoin, yêu cầu sử dụng API key trong header

### NowNodes
- **Số lượng API key**: 12
- **Rate limit**: 1 req/giây/key = 12 req/giây
- **Mô tả**: Private API cho Dogecoin, yêu cầu sử dụng API key trong header

## Cơ chế xoay vòng thông minh
- Hệ thống sử dụng tỷ lệ 3:1 (Tatum:NowNodes)
- Tatum được sử dụng cho 3/4 request, NowNodes cho 1/4 request
- Tỷ lệ này tối ưu hóa việc sử dụng API keys và tránh rate limit

## Tổng rate limit hiện tại cho Dogecoin
- **Tổng cộng**: ~57 request/giây

---

# Thông tin API cho các blockchain khác

## Ethereum (ETH)
- **Số lượng API key**: 10 (Etherscan)
- **Rate limit**: 5 req/giây/key = 50 req/giây

## Binance Smart Chain (BSC)
- **Số lượng API key**: 10 (BSCScan)
- **Rate limit**: 5 req/giây/key = 50 req/giây

## Solana (SOL)
- **RPC Public**: 40-50 req/giây
- **Helius API keys**: 13
- **Helius Rate limit**: 50 req/giây/key (chia sẻ) = ~160-170 req/giây
- **Tổng cộng**: ~210 req/giây