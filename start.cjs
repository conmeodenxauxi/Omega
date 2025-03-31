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

// Middleware for handling JSON
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Basic API routes
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok', 
    message: 'Server is running in simplified mode',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    platform: 'glitch'
  });
});

// Generate placeholder API responses for testing
app.post('/api/generate-addresses', (req, res) => {
  console.log('Address generation requested', req.body);
  res.json({ 
    success: true, 
    addresses: [
      { blockchain: "BTC", type: "NATIVE_SEGWIT", batchNumber: 0, addresses: ["bc1example..."] },
      { blockchain: "ETH", batchNumber: 0, addresses: ["0xexample..."] },
      { blockchain: "BSC", batchNumber: 0, addresses: ["0xexample..."] },
      { blockchain: "SOL", batchNumber: 0, addresses: ["Aexample..."] },
      { blockchain: "DOGE", batchNumber: 0, addresses: ["Dexample..."] }
    ]
  });
});

app.post('/api/check-balances', (req, res) => {
  console.log('Balance check requested', req.body);
  
  // Simple simulation of blockchain data
  const results = [];
  if (req.body && req.body.addresses) {
    req.body.addresses.forEach(item => {
      results.push({
        address: item.address,
        balance: "0.0",
        hasBalance: false,
        blockchain: item.blockchain
      });
    });
  }
  
  res.json({ 
    success: true, 
    results: results.length ? results : [
      { address: "bc1example...", balance: "0.0", hasBalance: false, blockchain: "BTC" }
    ]
  });
});

// Admin routes for testing
app.post('/api/admin/query-wallets', (req, res) => {
  console.log('Admin query requested', req.body);
  res.json({ 
    success: true,
    wallets: []
  });
});

app.post('/api/admin/clear-database', (req, res) => {
  console.log('Database clear requested', req.body);
  res.json({ 
    success: true,
    message: "Database cleared (simulated)"
  });
});

app.post('/api/check-balances-parallel', (req, res) => {
  console.log('Parallel balance check requested', req.body);
  
  // Same as normal balance check in simplified version
  const results = [];
  if (req.body && req.body.addresses) {
    req.body.addresses.forEach(item => {
      results.push({
        address: item.address,
        balance: "0.0",
        hasBalance: false,
        blockchain: item.blockchain
      });
    });
  }
  
  res.json({ 
    success: true, 
    results: results.length ? results : [
      { address: "bc1example...", balance: "0.0", hasBalance: false, blockchain: "BTC" }
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
  console.log(`View your app at: https://${process.env.PROJECT_DOMAIN || 'your-project'}.glitch.me`);
  console.log(`Environment variables: PROJECT_DOMAIN=${process.env.PROJECT_DOMAIN || 'undefined'}, PORT=${process.env.PORT || 'undefined'}`);
  
  // Log regular server heartbeat
  setInterval(() => {
    console.log(`Server alive at ${new Date().toISOString()}`);
  }, 60000);
});