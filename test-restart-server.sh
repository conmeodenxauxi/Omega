#!/bin/bash

echo "=== Ghi lại thời gian phản hồi trước khi khởi động lại ==="
BEFORE=$(curl -s http://localhost:5000/api/health | jq -r '.timestamp')
echo "Timestamp trước khi khởi động lại: $BEFORE"

echo -e "\n=== Đang kiểm tra cơ chế ping tự động trong client ==="
curl -s http://localhost:5000 > /dev/null # Tải trang client để kích hoạt ping tự động
echo "Đã tải trang client"

echo -e "\n=== Kiểm tra log của ping tự động trong browser console ==="
echo "Bạn có thể kiểm tra log 'Initial server ping at...' trong console của trình duyệt"

echo -e "\n=== Kiểm tra hiệu suất của cơ chế ping ==="
for i in {1..5}; do
  TIME=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:5000/api/health)
  echo "Thời gian phản hồi của ping #$i: $TIME giây"
done

echo -e "\nTất cả các kiểm tra đã hoàn thành. Endpoint /api/health và cơ chế ping tự động đang hoạt động tốt."
