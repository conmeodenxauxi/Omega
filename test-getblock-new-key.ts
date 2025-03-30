/**
 * Script kiểm tra key mới của GetBlock
 */

interface BalanceResponse {
  success: boolean;
  balance: string;
  error?: string;
}

/**
 * Kiểm tra API key mới của GetBlock
 */
async function testGetBlockKey(apiKey: string, address: string): Promise<BalanceResponse> {
  const url = `https://go.getblock.io/${apiKey}/api/v2/address/${address}?details=basic`;
  
  try {
    console.log(`Kiểm tra key ${apiKey.substring(0, 8)}... với địa chỉ ${address}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      console.error(`Lỗi HTTP: ${response.status}`);
      return { success: false, balance: '0', error: `HTTP Error ${response.status}` };
    }
    
    const data = await response.json();
    
    console.log('Phản hồi API:', JSON.stringify(data, null, 2));
    
    // GetBlock API có thể trả về cấu trúc khác nhau, kiểm tra các định dạng có thể
    if (data && typeof data.balance !== 'undefined') {
      const balance = (parseInt(data.balance) / 100000000).toFixed(8);
      console.log(`Kết quả: Thành công, Số dư = ${balance} BTC`);
      return { success: true, balance };
    } else if (data && data.data && typeof data.data.balance !== 'undefined') {
      const balance = (parseInt(data.data.balance) / 100000000).toFixed(8);
      console.log(`Kết quả: Thành công, Số dư = ${balance} BTC`);
      return { success: true, balance };
    } else if (data && data.result && typeof data.result.balance !== 'undefined') {
      const balance = (parseInt(data.result.balance) / 100000000).toFixed(8);
      console.log(`Kết quả: Thành công, Số dư = ${balance} BTC`);
      return { success: true, balance };
    } else {
      console.log(`Kết quả: Thành công, Số dư = 0 BTC hoặc định dạng phản hồi không xác định`);
      return { success: true, balance: '0.00000000' };
    }
  } catch (error) {
    console.error(`Lỗi: ${error instanceof Error ? error.message : String(error)}`);
    return { 
      success: false, 
      balance: '0', 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Chạy kiểm tra với key mới
 */
async function testNewGetBlockKey(): Promise<void> {
  // Key mới của GetBlock
  const newKey = '72ac9da16bc4458ca57dfe0dc61fa8b2';
  
  // Địa chỉ Bitcoin có số dư (để kiểm tra)
  const addressWithBalance = '1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ';
  
  // Địa chỉ Bitcoin không có số dư (để kiểm tra)
  const addressWithoutBalance = '1BitcoinEaterAddressDontSendf59kuE';
  
  console.log('Bắt đầu kiểm tra key GetBlock mới...');
  
  // Kiểm tra với địa chỉ có số dư
  await testGetBlockKey(newKey, addressWithBalance);
  
  // Kiểm tra với địa chỉ không có số dư
  await testGetBlockKey(newKey, addressWithoutBalance);
  
  console.log('Kiểm tra hoàn tất!');
}

// Chạy kiểm tra
testNewGetBlockKey().catch(error => {
  console.error('Lỗi trong quá trình kiểm tra:', error);
});