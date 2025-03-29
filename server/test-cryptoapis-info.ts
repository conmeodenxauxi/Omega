/**
 * Kiểm tra endpoint /info của CryptoAPIs và xem text thực tế
 */

import fetch from 'node-fetch';

const API_KEY = process.env.CRYPTOAPIS_API_KEY || '';
const TIMEOUT_MS = 5000;

function fetchWithTimeout(url: string, options: any, timeout = TIMEOUT_MS) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout)
    )
  ]) as Promise<Response>;
}

async function testInfoEndpoint() {
  console.log('🔍 Kiểm tra endpoint /info của CryptoAPIs');
  console.log(`🔑 API Key: ${API_KEY ? API_KEY.substring(0, 5) + '...' : 'Không có API key'}`);

  // URL endpoint
  const url = 'https://rest.cryptoapis.io/info';
  console.log(`🌐 URL: ${url}`);

  // Headers
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
  };

  try {
    console.log('🔄 Đang gửi request...');
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: headers
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log('📋 Headers:', response.headers);

    if (!response.ok) {
      console.error('❌ Lỗi HTTP!');
      return;
    }

    // Đọc response dưới dạng text thay vì JSON
    const responseText = await response.text();
    console.log('📝 Response Text:');
    console.log(responseText);
  } catch (error) {
    console.error('❌ Lỗi khi gửi request:', error);
  }
}

// Run the test
testInfoEndpoint().catch(error => {
  console.error('❌ Lỗi không mong muốn:', error);
});