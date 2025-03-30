#!/bin/bash

API_KEY="2bef078b-8ab5-41f6-bccb-0d900fe6507b"
BTC_ADDRESS="1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ"
DOGE_ADDRESS="D8vFz4p1L37jdg9xpPJo5PxqUKVczXxiEi"

echo "===== BTC API TEST ====="

echo "Kiểm tra BTC API root endpoint:"
curl -s -H "api-key: $API_KEY" "https://btcbook.nownodes.io/api/" | head -20

# Pause để tránh rate limit
sleep 2

echo -e "\nKiểm tra BTC API với địa chỉ cụ thể (format v1):"
curl -s -H "api-key: $API_KEY" "https://btcbook.nownodes.io/api/address/$BTC_ADDRESS"

# Pause để tránh rate limit
sleep 2

echo "===== DOGE API TEST ====="

echo -e "\nKiểm tra DOGE API root endpoint:"
curl -s -H "api-key: $API_KEY" "https://dogebook.nownodes.io/api/" | head -20

# Pause để tránh rate limit
sleep 2

echo -e "\nKiểm tra DOGE API với địa chỉ cụ thể (format v1):"
curl -s -H "api-key: $API_KEY" "https://dogebook.nownodes.io/api/address/$DOGE_ADDRESS"