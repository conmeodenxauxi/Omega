import fetch from 'node-fetch';

// Key DOGE
const dogeKey = 't-67e87affe4894dd7808eadc80e5e5ec2';

// Thử dùng key DOGE cho API DOGE
async function testDogeKey() {
  console.log('=== THỬ DÙNG KEY DOGE CHO API DOGE ===');
  const url = `https://api.tatum.io/v3/dogecoin/address/balance/DDTtqnuZ5kfRT5qh2c7sNtqrJmV3iXYdGG`;
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': dogeKey
    }
  };

  try {
    console.log('Checking DOGE với DOGE API key');
    const response = await fetch(url, options);
    console.log('Response status:', response.status);
    
    const data = await response.json() as any;
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

await testDogeKey();