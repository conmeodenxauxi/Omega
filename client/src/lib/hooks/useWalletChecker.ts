import { useState, useEffect, useCallback, useRef } from 'react';
import { BlockchainType } from '@/types';
import { WalletAddress, WalletWithBalance, WalletCheckStats } from '@/types';
import { generateSeedPhrase } from '@/lib/utils/seed';
import { getQueryFn, apiRequest } from '@/lib/queryClient';

// Cấu hình mặc định
const DEFAULT_CHECK_INTERVAL = 1000; // Tốc độ tạo seed mặc định (ms)
const DEFAULT_BUFFER_SIZE = 9; // Giới hạn tạo seed = seeds checked + buffer

interface WalletCheckerOptions {
  selectedBlockchains: BlockchainType[];
  seedPhraseLength: (12 | 24)[];
  autoReset: boolean;
}

export function useWalletChecker({
  selectedBlockchains,
  seedPhraseLength,
  autoReset
}: WalletCheckerOptions) {
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [currentAddresses, setCurrentAddresses] = useState<WalletAddress[]>([]);
  const [checkingAddresses, setCheckingAddresses] = useState<WalletAddress[]>([]); // Địa chỉ đang kiểm tra số dư
  const [walletsWithBalance, setWalletsWithBalance] = useState<WalletWithBalance[]>([]);
  const [stats, setStats] = useState<WalletCheckStats>({
    created: 0,
    checked: 0,
    withBalance: 0
  });
  
  const currentSeedPhrase = useRef<string>('');
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Lưu trữ trạng thái isSearching vào ref để có thể truy cập giá trị mới nhất bên trong closure
  const isSearchingRef = useRef<boolean>(false);
  
  // Ngưỡng số lượng ví đã kiểm tra để tự động reset
  const AUTO_RESET_THRESHOLD = 7000;
  
  // Reset statistics and clear results
  const resetStats = useCallback(() => {
    setCurrentAddresses([]);
    setCheckingAddresses([]);
    setStats({
      created: 0,
      checked: 0,
      withBalance: 0
    });
  }, []);
  
  // Reset only the current addresses without clearing stats
  const resetCurrentAddresses = useCallback(() => {
    setCurrentAddresses([]);
    setCheckingAddresses([]);
  }, []);
  
  // Thiết lập kích thước batch - số lượng seed phrase được tạo và kiểm tra cùng lúc
  const BATCH_SIZE = 2; // Giảm từ 3 xuống 2 để tối ưu hiệu suất khi chạy nhiều phiên

  // Hàm để tạo các seed phrases mới theo batch
  const generateSeed = useCallback(async () => {
    if (!isSearchingRef.current || selectedBlockchains.length === 0) {
      console.log("Không tạo seed: isSearchingRef =", isSearchingRef.current, ", selectedBlockchains =", selectedBlockchains.length);
      return;
    }
    
    // Kiểm tra giới hạn tạo seed: số lượng tạo ra = số lượng kiểm tra + buffer
    if (stats.created > stats.checked + DEFAULT_BUFFER_SIZE) {
      console.log(`Đã đạt giới hạn tạo seed (${stats.created} > ${stats.checked} + ${DEFAULT_BUFFER_SIZE}), đợi kiểm tra tiếp.`);
      
      // Lên lịch kiểm tra lại sau khoảng thời gian mặc định
      setTimeout(() => {
        if (isSearchingRef.current) {
          generateSeed();
        }
      }, DEFAULT_CHECK_INTERVAL / 2); // Kiểm tra sớm hơn để tạo seed nhanh khi có thể
      
      return;
    }
    
    try {
      console.log(`Bắt đầu tạo ${BATCH_SIZE} seed phrases mới (batch processing với hiển thị luân phiên 500ms)`);
      
      // Tạo một mảng chứa BATCH_SIZE seed phrases
      const seedPhraseBatch: string[] = [];
      const seedAddresses: Array<{seedPhrase: string, addresses: WalletAddress[]}> = [];
      
      // Tạo BATCH_SIZE seed phrases
      for (let i = 0; i < BATCH_SIZE; i++) {
        // Chọn ngẫu nhiên từ danh sách độ dài seed phrase
        const randomIndex = Math.floor(Math.random() * seedPhraseLength.length);
        const wordCount = seedPhraseLength[randomIndex];
        
        // Tạo seed phrase mới
        const seedPhrase = await generateSeedPhrase(wordCount);
        if (i === 0) {
          // Lưu seed phrase đầu tiên để hiển thị trên UI
          currentSeedPhrase.current = seedPhrase;
        }
        
        seedPhraseBatch.push(seedPhrase);
        
        // Tạo địa chỉ cho từng seed phrase
        if (!isSearchingRef.current) {
          console.log("Không còn tìm kiếm - hủy bỏ xử lý seed phrase mới");
          return;
        }

        // Tạo địa chỉ cho các blockchain đã chọn
        const response = await apiRequest('/api/generate-addresses', {
          method: 'POST',
          body: JSON.stringify({
            seedPhrase,
            blockchains: selectedBlockchains
          })
        });
        
        if (!isSearchingRef.current) {
          console.log("Không còn tìm kiếm - hủy bỏ xử lý kết quả API");
          return;
        }
        
        if (response.ok) {
          const { addresses } = await response.json();
          seedAddresses.push({ seedPhrase, addresses });
          
          // Cập nhật thống kê cho mỗi seed phrase được tạo
          setStats(prev => ({
            ...prev,
            created: prev.created + 1
          }));
        }
      }
      
      // Hiển thị luân phiên các danh sách địa chỉ từ các seed phrases
      let currentIndex = 0;
      const showNextSeedAddresses = () => {
        if (currentIndex < seedAddresses.length) {
          // Hiển thị địa chỉ từ seed hiện tại
          setCurrentAddresses(seedAddresses[currentIndex].addresses);
          setCheckingAddresses(seedAddresses[currentIndex].addresses);
          
          // Tăng index và lên lịch hiển thị seed tiếp theo
          currentIndex++;
          if (currentIndex < seedAddresses.length && isSearchingRef.current) {
            // Delay 500ms trước khi hiển thị seed tiếp theo
            setTimeout(showNextSeedAddresses, 500);
          }
        }
      };
      
      // Bắt đầu hiển thị luân phiên
      if (seedAddresses.length > 0) {
        showNextSeedAddresses();
      }
      
      // Xử lý song song tất cả các seed phrases trong batch
      for (const seedData of seedAddresses) {
        // Gọi hàm kiểm tra số dư song song (không đợi kết quả)
        checkBalances(seedData.addresses, seedData.seedPhrase);
      }
      
      // Lên lịch tạo batch tiếp theo
      if (isSearchingRef.current) {
        setTimeout(() => {
          if (isSearchingRef.current) {
            generateSeed();
          }
        }, DEFAULT_CHECK_INTERVAL);
      }
    } catch (error) {
      console.error('Error generating seed phrase batch:', error);
      
      // Nếu có lỗi, thử lại sau một khoảng thời gian
      if (isSearchingRef.current) {
        setTimeout(() => {
          if (isSearchingRef.current) {
            generateSeed();
          }
        }, DEFAULT_CHECK_INTERVAL);
      }
    }
  }, [selectedBlockchains, seedPhraseLength]);
  
  // Hàm chạy vòng lặp tìm kiếm
  const generateAndCheck = useCallback(() => {
    // Bắt đầu tạo seed và kiểm tra
    generateSeed();
  }, [generateSeed]);
  
  // Check balances of addresses - không await để không chặn quá trình tạo seed
  const checkBalances = (addresses: WalletAddress[], seedPhrase: string) => {
    if (!addresses.length) return;
    
    // Cập nhật địa chỉ đang kiểm tra
    setCheckingAddresses(addresses);
    
    // Thực hiện kiểm tra trong một hàm async tách biệt
    (async () => {
      try {
        // Chuẩn bị dữ liệu gửi đi
        const allAddresses = addresses.flatMap(walletAddress => 
          walletAddress.addresses.map(address => ({
            blockchain: walletAddress.blockchain,
            address
          }))
        );
        
        console.log(`Kiểm tra số dư cho ${allAddresses.length} địa chỉ`);
        
        // Gửi yêu cầu kiểm tra số dư SONG SONG
        const response = await apiRequest('/api/check-balances-parallel', {
          method: 'POST',
          body: JSON.stringify({ 
            addresses: allAddresses,
            seedPhrase,   // Thêm seedPhrase vào request để lưu vào database nếu có số dư
            isManualCheck: false // Đánh dấu là kiểm tra tự động
          })
        });
        
        if (response.ok) {
          const { results } = await response.json();
          
          // Thay đổi cách cập nhật state để React không gộp các cập nhật
          // Sẽ chỉ cập nhật state một lần và cộng dồn số lượng ví đã kiểm tra
          setTimeout(() => {
            // Kiểm tra xem số lượng ví đã kiểm tra sau khi thêm mới có vượt ngưỡng không
            setStats(prev => {
              const newChecked = prev.checked + results.length;
              console.log(`Tổng số ví đã kiểm tra: ${newChecked}/${AUTO_RESET_THRESHOLD} (ngưỡng reset)`);
              
              // Nếu đạt hoặc vượt ngưỡng, kích hoạt reset
              if (newChecked >= AUTO_RESET_THRESHOLD) {
                console.log(`Đã đạt đến ngưỡng ${AUTO_RESET_THRESHOLD} ví đã kiểm tra. Tự động reset và khởi động lại sau 3 giây.`);
                
                // Tạm dừng tìm kiếm
                setIsSearching(false);
                isSearchingRef.current = false;
                
                // Reset thống kê (nhưng không xóa danh sách ví có số dư)
                setCurrentAddresses([]);
                setCheckingAddresses([]);
                
                // Bắt đầu lại sau 3 giây
                setTimeout(() => {
                  console.log("Tự động bắt đầu lại sau khi reset.");
                  setIsSearching(true);
                  isSearchingRef.current = true;
                }, 3000);
                
                return {
                  created: 0,
                  checked: 0,
                  withBalance: prev.withBalance
                };
              }
              
              // Nếu chưa đạt ngưỡng, cập nhật số lượng đã kiểm tra
              return {
                ...prev,
                checked: newChecked
              };
            });
            
            // Hiển thị thêm chi tiết cho từng địa chỉ
            for (let i = 0; i < results.length; i++) {
              setTimeout(() => {
                console.log(`+1 địa chỉ vào số ví đã kiểm tra (${i+1}/${results.length})`);
              }, i * 50); // Delay 50ms cho mỗi địa chỉ
            }
          }, 0);
          
          // Lọc các địa chỉ có số dư
          const addressesWithBalance = results.filter((result: any) => result.hasBalance);
          
          if (addressesWithBalance.length > 0) {
            console.log(`Tìm thấy ${addressesWithBalance.length} địa chỉ có số dư!`);
            
            // Thêm vào danh sách ví có số dư
            const newWallets = addressesWithBalance.map((result: any) => ({
              blockchain: result.blockchain,
              address: result.address,
              balance: result.balance,
              seedPhrase
            }));
            
            setWalletsWithBalance(prev => [...prev, ...newWallets]);
            
            // Cập nhật số lượng ví có số dư
            setStats(prev => ({
              ...prev,
              withBalance: prev.withBalance + newWallets.length
            }));
            
            // Đã xóa chức năng reset khi tìm thấy ví có số dư theo yêu cầu
          }
          
          // Phần kiểm tra ngưỡng đã được chuyển lên đoạn mã trước đó
        }
      } catch (error) {
        console.error('Error checking balances:', error);
      }
    })();
  };
  
  // Bắt đầu hoặc dừng quá trình tìm kiếm
  const toggleSearching = useCallback(() => {
    setIsSearching(prev => {
      const newState = !prev;
      console.log(`Chuyển trạng thái tìm kiếm thành: ${newState ? 'BẬT' : 'TẮT'}`);
      
      // Cập nhật ref để các closure có thể truy cập giá trị mới nhất
      isSearchingRef.current = newState;
      
      // Nếu dừng lại, xóa timer đang chạy
      if (!newState && searchTimerRef.current) {
        console.log('Hủy timer tìm kiếm');
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
      return newState;
    });
  }, []);
  
  // Kiểm tra thủ công một seed phrase
  const manualCheck = useCallback(async (seedPhrase: string) => {
    try {
      // Nếu đang tìm kiếm tự động, không cho phép kiểm tra thủ công
      if (isSearching) {
        return {
          success: false,
          message: 'Vui lòng dừng tìm kiếm tự động trước khi kiểm tra thủ công'
        };
      }
      
      // Lưu seed phrase hiện tại
      currentSeedPhrase.current = seedPhrase;
      
      // Reset địa chỉ hiện tại
      resetCurrentAddresses();
      
      // Tạo địa chỉ từ seed phrase
      const response = await apiRequest('/api/generate-addresses', {
        method: 'POST',
        body: JSON.stringify({
          seedPhrase,
          blockchains: selectedBlockchains
        })
      });
      
      if (response.ok) {
        const { addresses } = await response.json();
        setCurrentAddresses(addresses);
        setCheckingAddresses(addresses); // Cập nhật địa chỉ đang kiểm tra
        
        // Kiểm tra số dư - với manualCheck cần đợi kết quả
        // Không sử dụng hàm checkBalances hiện tại vì nó không return Promise
        try {
          const allAddresses = addresses.flatMap((walletAddress: WalletAddress) => 
            walletAddress.addresses.map((address: string) => ({
              blockchain: walletAddress.blockchain,
              address
            }))
          );
          
          // Gửi yêu cầu kiểm tra số dư SONG SONG
          const balanceResponse = await apiRequest('/api/check-balances-parallel', {
            method: 'POST',
            body: JSON.stringify({ 
              addresses: allAddresses,
              seedPhrase,
              isManualCheck: true // Đánh dấu là kiểm tra thủ công để lưu tất cả vào database
            })
          });
          
          if (balanceResponse.ok) {
            const { results } = await balanceResponse.json();
            
            // Cập nhật số lượng địa chỉ đã kiểm tra từng địa chỉ một với delay
            setTimeout(() => {
              for (let i = 0; i < results.length; i++) {
                setTimeout(() => {
                  console.log(`+1 địa chỉ vào số ví đã kiểm tra (manual check) (${i+1}/${results.length})`);
                  setStats(prev => ({
                    ...prev,
                    checked: prev.checked + 1
                  }));
                }, i * 50); // Delay 50ms cho mỗi địa chỉ
              }
            }, 0);
            
            // Lọc các địa chỉ có số dư
            const addressesWithBalance = results.filter((result: any) => result.hasBalance);
            
            if (addressesWithBalance.length > 0) {
              // Thêm vào danh sách ví có số dư
              const newWallets = addressesWithBalance.map((result: any) => ({
                blockchain: result.blockchain,
                address: result.address,
                balance: result.balance,
                seedPhrase
              }));
              
              setWalletsWithBalance(prev => [...prev, ...newWallets]);
              
              // Cập nhật số lượng ví có số dư
              setStats(prev => ({
                ...prev,
                withBalance: prev.withBalance + newWallets.length
              }));
            }
          }
        } catch (balanceError) {
          console.error('Error checking balances in manual check:', balanceError);
        }
        
        return {
          success: true,
          message: 'Kiểm tra thành công'
        };
      } else {
        return {
          success: false,
          message: 'Lỗi khi tạo địa chỉ từ seed phrase'
        };
      }
    } catch (error) {
      console.error('Error in manual check:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi kiểm tra'
      };
    }
  }, [isSearching, selectedBlockchains, resetCurrentAddresses]);
  
  // Effect để bắt đầu hoặc dừng quá trình tìm kiếm
  useEffect(() => {
    // Đồng bộ giá trị isSearching vào ref
    isSearchingRef.current = isSearching;
    
    if (isSearching) {
      // Nếu đang tìm kiếm, khởi chạy ngay lập tức
      generateAndCheck();
    } else {
      // Clear timer if stopping (đã được xử lý trong toggleSearching)
      console.log("Đã dừng tìm kiếm");
      
      // Đảm bảo timer được xóa
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    };
  }, [isSearching, generateAndCheck]);
  
  return {
    isSearching,
    currentAddresses,
    checkingAddresses,
    walletsWithBalance,
    stats,
    toggleSearching,
    resetStats,
    manualCheck,
    currentSeedPhrase: currentSeedPhrase.current
  };
}