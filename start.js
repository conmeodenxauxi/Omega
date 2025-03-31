// Simplified startup script for Glitch
const express = require('express');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data', { recursive: true });
  console.log("Created data directory");
}

// Create simple Express server
const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'client/dist')));

// Basic API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running in simplified mode' });
});

// Generate placeholder API responses for testing
app.post('/api/generate-addresses', (req, res) => {
  res.json({ 
    success: true, 
    addresses: [
      { blockchain: "BTC", addresses: ["bc1example..."] },
      { blockchain: "ETH", addresses: ["0xexample..."] }
    ]
  });
});

app.post('/api/check-balances', (req, res) => {
  res.json({ 
    success: true, 
    results: [
      { address: "bc1example...", balance: "0.0", blockchain: "BTC" }
    ]
  });
});

// Fallback route - serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`View your app at: https://${process.env.PROJECT_DOMAIN}.glitch.me`);
});