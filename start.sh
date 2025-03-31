#!/bin/bash

# Đảm bảo thư mục data tồn tại
mkdir -p data

# Khởi động ứng dụng đơn giản
echo "Starting application in simplified mode..."
# Sử dụng đường dẫn tuyệt đối cho node trên Glitch
/usr/local/bin/node start.cjs