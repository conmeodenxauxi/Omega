/**
 * Script mô phỏng việc server bị sập
 * Sẽ tạm thời kích hoạt trạng thái 503 cho route /api/health trong 20 giây
 */

const express = require('express');
const app = express();
const port = 5001;

// Biến để kiểm soát trạng thái
let isServerDown = false;

// Route để kiểm tra trạng thái hiện tại
app.get('/status', (req, res) => {
  res.json({
    status: isServerDown ? 'down' : 'up',
    message: isServerDown ? 'Server hiện đang offline (mô phỏng)' : 'Server đang hoạt động bình thường'
  });
});

// Route để kích hoạt trạng thái down
app.get('/trigger-down', (req, res) => {
  if (isServerDown) {
    return res.json({
      success: false,
      message: 'Server đã ở trạng thái down sẵn rồi'
    });
  }

  // Đặt trạng thái offline
  isServerDown = true;
  console.log('Đã kích hoạt trạng thái DOWN');

  // Sau 20 giây, tự động phục hồi
  setTimeout(() => {
    isServerDown = false;
    console.log('Đã tự động phục hồi trạng thái UP sau 20 giây');
  }, 20000);

  res.json({
    success: true,
    message: 'Đã kích hoạt trạng thái DOWN. Sẽ tự động phục hồi sau 20 giây'
  });
});

// Route để kích hoạt trạng thái up (phục hồi thủ công)
app.get('/trigger-up', (req, res) => {
  if (!isServerDown) {
    return res.json({
      success: false,
      message: 'Server đã ở trạng thái up sẵn rồi'
    });
  }

  // Phục hồi trạng thái
  isServerDown = false;
  console.log('Đã kích hoạt phục hồi trạng thái UP');

  res.json({
    success: true,
    message: 'Đã phục hồi trạng thái UP'
  });
});

// Khởi động server
app.listen(port, () => {
  console.log(`Simulator chạy trên cổng ${port}`);
  console.log(`* Để kiểm tra trạng thái: http://localhost:${port}/status`);
  console.log(`* Để kích hoạt DOWN: http://localhost:${port}/trigger-down`);
  console.log(`* Để phục hồi UP: http://localhost:${port}/trigger-up`);
});