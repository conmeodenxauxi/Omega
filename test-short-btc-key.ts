import fetch from 'node-fetch';

// Key BTC định dạng ngắn
const shortBtcKey = 't-67e8905d66a3497e8e2ea0ad59c71d8c';

// Thử dùng key BTC định dạng ngắn
async function testShortBtcKey() {
  console.log('=== THỬ DÙNG KEY BTC ĐỊNH DẠNG NGẮN ===');
  const url = `https://api.tatum.io/v3/bitcoin/address/balance/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`;
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': shortBtcKey
    }
  };

  try {
    console.log('Checking BTC với key ngắn');
    const response = await fetch(url, options);
    console.log('Response status:', response.status);
    
    const data = await response.json() as any;
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

await testShortBtcKey();