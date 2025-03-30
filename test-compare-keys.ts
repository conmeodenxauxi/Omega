import fetch from 'node-fetch';

// Key đang hoạt động cho DOGE
const workingDogeKey = 't-67e87affe4894dd7808eadc80e5e5ec2';

// Key không hoạt động cho BTC
const nonWorkingBtcKey = 't-67e8905d832893ddeb2bfbdd-d9ca7eea673d470d81acbe47';
const shortBtcKey = 't-67e8905d66a3497e8e2ea0ad59c71d8c';

// So sánh định dạng key
console.log('=== SO SÁNH ĐỊNH DẠNG KEY ===');
console.log('DOGE key hợp lệ:', workingDogeKey, `(độ dài ${workingDogeKey.length})`);
console.log('BTC key dài:', nonWorkingBtcKey, `(độ dài ${nonWorkingBtcKey.length})`);
console.log('BTC key ngắn:', shortBtcKey, `(độ dài ${shortBtcKey.length})`);

// Thử dùng key DOGE để truy cập API BTC
async function testCrossChainKey() {
  console.log('\n=== THỬ DÙNG KEY DOGE CHO API BTC ===');
  const url = `https://api.tatum.io/v3/bitcoin/address/balance/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`;
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': workingDogeKey
    }
  };

  try {
    console.log('Checking BTC với DOGE API key');
    const response = await fetch(url, options);
    console.log('Response status:', response.status);
    
    const data = await response.json() as any;
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

await testCrossChainKey();