#!/bin/bash

echo "=== Bắt đầu kiểm tra ping liên tục trong 30 giây ==="
echo "Thời gian bắt đầu: $(date)"

START_TIME=$(date +%s)
END_TIME=$((START_TIME + 30))
PING_COUNT=0
FAIL_COUNT=0

while [ $(date +%s) -lt $END_TIME ]; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
  
  if [ "$RESPONSE" -eq 200 ]; then
    echo -n "."
    PING_COUNT=$((PING_COUNT + 1))
  else
    echo -n "F"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  
  sleep 0.5
done

echo ""
echo "=== Kết quả kiểm tra ==="
echo "Tổng số ping: $PING_COUNT"
echo "Số lỗi: $FAIL_COUNT"
echo "Tỷ lệ thành công: $(echo "scale=2; ($PING_COUNT * 100) / ($PING_COUNT + $FAIL_COUNT)" | bc)%"
echo "Thời gian kết thúc: $(date)"
