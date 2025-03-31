// Simplified startup script for Glitch
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES Modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
  console.log(`View your app at: https://${process.env.PROJECT_DOMAIN}.glitch.me`);
  
  // Log để debug
  console.log(`Environment variables: PROJECT_DOMAIN=${process.env.PROJECT_DOMAIN}, PORT=${process.env.PORT}`);
});