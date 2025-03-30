#!/bin/bash

# Test endpoint ping
echo "=== Testing /api/health API endpoint ==="
curl -s http://localhost:5000/api/health
echo -e "\n"

# Kiểm tra xem endpoint có trả về status 200 không
echo "=== Testing HTTP status code ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ "$STATUS" -eq 200 ]; then
  echo "SUCCESS: API returned status 200"
else
  echo "ERROR: API returned status $STATUS, expected 200"
fi
echo ""

# Kiểm tra xem dữ liệu JSON có đúng cấu trúc không
echo "=== Testing JSON response structure ==="
RESULT=$(curl -s http://localhost:5000/api/health | jq -r 'if has("status") and has("timestamp") then "valid" else "invalid" end')
if [ "$RESULT" == "valid" ]; then
  echo "SUCCESS: JSON has correct structure with status and timestamp fields"
else
  echo "ERROR: JSON does not have the expected structure"
fi
echo ""

# Kiểm tra hiệu suất với nhiều request liên tiếp
echo "=== Performance testing (10 consecutive requests) ==="
for i in {1..10}; do
  start=$(date +%s.%N)
  curl -s http://localhost:5000/api/health > /dev/null
  end=$(date +%s.%N)
  runtime=$(echo "$end - $start" | bc -l)
  echo "Request $i: $runtime seconds"
done

echo -e "\nAll tests completed."
