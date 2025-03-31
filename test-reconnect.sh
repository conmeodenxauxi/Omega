#!/bin/bash

# Script để kiểm tra tính năng mất kết nối và tự động kích hoạt lại tìm kiếm
echo "=== Kiểm tra tính năng mất kết nối và tự động phục hồi ==="
echo "1. Kiểm tra trạng thái ban đầu"
curl -s http://localhost:5000/api/test/server-status | jq

echo -e "\n2. Kích hoạt trạng thái DOWN trong 25 giây"
curl -s "http://localhost:5000/api/test/server-down?duration=25" | jq

echo -e "\n3. Kiểm tra trạng thái sau khi kích hoạt DOWN"
curl -s http://localhost:5000/api/test/server-status | jq

echo -e "\n4. Kiểm tra health endpoint (sẽ trả về lỗi 503)"
curl -s -i http://localhost:5000/api/health | head -n 1

echo -e "\n5. Đang đợi 5 giây..."
sleep 5

echo -e "\n6. Kiểm tra health endpoint lần nữa (vẫn sẽ trả về lỗi 503)"
curl -s -i http://localhost:5000/api/health | head -n 1

echo -e "\n7. Đang đợi phục hồi tự động (20 giây còn lại)..."
echo "   (Hãy theo dõi console để xem thông báo mất kết nối và phục hồi)"
sleep 20

echo -e "\n8. Kiểm tra trạng thái sau khi phục hồi"
curl -s http://localhost:5000/api/test/server-status | jq

echo -e "\n9. Kiểm tra health endpoint (sẽ trả về 200 OK)"
curl -s -i http://localhost:5000/api/health | head -n 1

echo -e "\n=== Kiểm tra hoàn tất ==="
echo "Hãy quan sát log trong console để xem thông báo kích hoạt tìm kiếm tự động"