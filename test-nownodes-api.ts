/**
 * Script để kiểm tra API key của NowNodes.io cho BTC và Dogecoin
 */
import fetch from 'node-fetch';

const NOWNODES_API_KEY = '2bef078b-8ab5-41f6-bccb-0d900fe6507b';

// Địa chỉ nổi tiếng để kiểm tra
const FAMOUS_ADDRESSES = {
  BTC: [
    '3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5', // Địa chỉ Bitfinex có số dư lớn
    '1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ', // Địa chỉ nổi tiếng khác
  ],
  DOGE: [
    'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L', // Địa chỉ Dogecoin của Robinhood
    'D8vFz4p1L37jdg9xpPJo5PxqUKVczXxiEi' // Địa chỉ Dogecoin khác có số dư lớn
  ]
};

/**
 * Kiểm tra số dư Bitcoin qua NowNodes.io
 */
async function checkBTCBalance(address: string): Promise<void> {
  console.log(`\nKiểm tra số dư BTC cho địa chỉ: ${address}`);
  try {
    // Endpoint cho Bitcoin
    // Dựa vào tài liệu, đường dẫn đúng có thể khác
    const url = `https://btcbook.nownodes.io/api/v2/address/${address}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api-key': NOWNODES_API_KEY
      }
    });
    
    console.log(`Status code: ${response.status}`);
    console.log(`Headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
    
    // Ghi nhật ký phản hồi gốc để kiểm tra
    const responseText = await response.text();
    console.log(`Phản hồi gốc từ NowNodes BTC API:`);
    console.log(responseText);
    
    try {
      // Cố gắng phân tích JSON nếu có thể
      const data = JSON.parse(responseText);
      console.log(`Dữ liệu JSON: ${JSON.stringify(data, null, 2)}`);
      
      // Kiểm tra xem có dữ liệu về số dư không (kiểm tra nhiều trường có thể)
      if (data) {
        if (data.balance !== undefined) {
          console.log(`✅ API NowNodes BTC hoạt động tốt - Số dư: ${data.balance}`);
        } else if (data.amount !== undefined) {
          console.log(`✅ API NowNodes BTC hoạt động tốt - Số dư: ${data.amount}`);
        } else if (data.final_balance !== undefined) {
          console.log(`✅ API NowNodes BTC hoạt động tốt - Số dư: ${data.final_balance}`);
        } else {
          console.log(`❌ API NowNodes BTC không trả về số dư trong định dạng được biết đến`);
        }
      } else {
        console.log(`❌ API NowNodes BTC không trả về dữ liệu`);
      }
    } catch (jsonError) {
      console.log(`❌ Phản hồi không phải là JSON hợp lệ`);
    }
  } catch (error) {
    console.error(`❌ Lỗi khi kiểm tra số dư BTC:`, error);
  }
}

/**
 * Kiểm tra số dư Dogecoin qua NowNodes.io
 */
async function checkDOGEBalance(address: string): Promise<void> {
  console.log(`\nKiểm tra số dư DOGE cho địa chỉ: ${address}`);
  try {
    // Endpoint cho Dogecoin
    // Dựa vào tài liệu, đường dẫn đúng có thể khác
    const url = `https://dogebook.nownodes.io/api/v2/address/${address}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api-key': NOWNODES_API_KEY
      }
    });
    
    console.log(`Status code: ${response.status}`);
    console.log(`Headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
    
    // Ghi nhật ký phản hồi gốc để kiểm tra
    const responseText = await response.text();
    console.log(`Phản hồi gốc từ NowNodes DOGE API:`);
    console.log(responseText);
    
    try {
      // Cố gắng phân tích JSON nếu có thể
      const data = JSON.parse(responseText);
      console.log(`Dữ liệu JSON: ${JSON.stringify(data, null, 2)}`);
      
      // Kiểm tra xem có dữ liệu về số dư không (kiểm tra nhiều trường có thể)
      if (data) {
        if (data.balance !== undefined) {
          console.log(`✅ API NowNodes DOGE hoạt động tốt - Số dư: ${data.balance}`);
        } else if (data.amount !== undefined) {
          console.log(`✅ API NowNodes DOGE hoạt động tốt - Số dư: ${data.amount}`);
        } else if (data.final_balance !== undefined) {
          console.log(`✅ API NowNodes DOGE hoạt động tốt - Số dư: ${data.final_balance}`);
        } else {
          console.log(`❌ API NowNodes DOGE không trả về số dư trong định dạng được biết đến`);
        }
      } else {
        console.log(`❌ API NowNodes DOGE không trả về dữ liệu`);
      }
    } catch (jsonError) {
      console.log(`❌ Phản hồi không phải là JSON hợp lệ`);
    }
  } catch (error) {
    console.error(`❌ Lỗi khi kiểm tra số dư DOGE:`, error);
  }
}

/**
 * Hàm chính để chạy tất cả các kiểm tra
 */
async function runTests(): Promise<void> {
  console.log('===== KIỂM TRA API KEY NOWNODES.IO =====');
  console.log(`API Key: ${NOWNODES_API_KEY}`);
  
  // Kiểm tra Bitcoin
  console.log('\n===== KIỂM TRA BITCOIN =====');
  for (const address of FAMOUS_ADDRESSES.BTC) {
    await checkBTCBalance(address);
  }
  
  // Kiểm tra Dogecoin
  console.log('\n===== KIỂM TRA DOGECOIN =====');
  for (const address of FAMOUS_ADDRESSES.DOGE) {
    await checkDOGEBalance(address);
  }
  
  console.log('\n===== KẾT QUẢ TỔNG THỂ =====');
}

// Chạy tất cả các kiểm tra
runTests().catch(error => {
  console.error('Lỗi khi chạy các kiểm tra:', error);
});