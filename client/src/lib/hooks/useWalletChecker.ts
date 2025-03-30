import { useState, useEffect, useCallback, useRef } from 'react';
import { BlockchainType } from '@shared/schema';
import { WalletAddress, WalletWithBalance, WalletCheckStats } from '@/types';
import { generateSeedPhrase } from '@/lib/utils/seed';
import { getQueryFn, apiRequest } from '@/lib/queryClient';

// Cấu hình mặc định
const DEFAULT_CHECK_INTERVAL = 1000; // Tốc độ tạo seed mặc định (ms)
const DEFAULT_BUFFER_SIZE = 5; // Giới hạn tạo seed = seeds checked + buffer

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
  
  // Hàm chỉ để tạo seed phrase mới
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
      console.log("Bắt đầu tạo seed phrase mới");
      
      // Chọn ngẫu nhiên từ danh sách độ dài seed phrase
      const randomIndex = Math.floor(Math.random() * seedPhraseLength.length);
      const wordCount = seedPhraseLength[randomIndex];
      
      // Tạo seed phrase mới
      const seedPhrase = await generateSeedPhrase(wordCount);
      currentSeedPhrase.current = seedPhrase;
      
      // Reset current addresses
      resetCurrentAddresses();
      
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
        setCurrentAddresses(addresses);
        
        // Cập nhật thống kê
        setStats(prev => ({
          ...prev,
          created: prev.created + 1
        }));
        
        // Gọi hàm kiểm tra số dư song song (không đợi kết quả)
        checkBalances(addresses, seedPhrase);
        
        // Lên lịch tạo seed tiếp theo ngay lập tức
        if (isSearchingRef.current) {
          setTimeout(() => {
            if (isSearchingRef.current) {
              generateSeed();
            }
          }, DEFAULT_CHECK_INTERVAL);
        }
      }
    } catch (error) {
      console.error('Error generating seed phrase:', error);
      
      // Nếu có lỗi, thử lại sau một khoảng thời gian
      if (isSearchingRef.current) {
        setTimeout(() => {
          if (isSearchingRef.current) {
            generateSeed();
          }
        }, DEFAULT_CHECK_INTERVAL);
      }
    }
  }, [selectedBlockchains, seedPhraseLength, resetCurrentAddresses]);
  
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
            seedPhrase   // Thêm seedPhrase vào request để lưu vào database nếu có số dư
          })
        });
        
        if (response.ok) {
          const { results } = await response.json();
          
          // Cập nhật số lượng địa chỉ đã kiểm tra
          let shouldAutoReset = false;
          
          setStats(prev => {
            const newChecked = prev.checked + allAddresses.length;
            // Kiểm tra xem có cần tự động reset không
            shouldAutoReset = newChecked >= AUTO_RESET_THRESHOLD;
            
            return {
              ...prev,
              checked: newChecked
            };
          });
          
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
            
            // Nếu có địa chỉ với số dư và autoReset được bật, reset thống kê
            if (autoReset) {
              resetStats();
            }
          }
          
          // Kiểm tra nếu đã đạt đến ngưỡng tự động reset
          if (shouldAutoReset) {
            console.log(`Đã đạt đến ngưỡng ${AUTO_RESET_THRESHOLD} ví đã kiểm tra. Tự động reset và khởi động lại sau 3 giây.`);
            
            // Tạm dừng tìm kiếm
            setIsSearching(false);
            isSearchingRef.current = false;
            
            // Reset thống kê (nhưng không xóa danh sách ví có số dư)
            setCurrentAddresses([]);
            setCheckingAddresses([]);
            setStats({
              created: 0,
              checked: 0,
              withBalance: 0
            });
            
            // Bắt đầu lại sau 3 giây
            setTimeout(() => {
              console.log("Tự động bắt đầu lại sau khi reset.");
              setIsSearching(true);
              isSearchingRef.current = true;
            }, 3000);
          }
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
          const allAddresses = addresses.flatMap(walletAddress => 
            walletAddress.addresses.map(address => ({
              blockchain: walletAddress.blockchain,
              address
            }))
          );
          
          // Gửi yêu cầu kiểm tra số dư SONG SONG
          const balanceResponse = await apiRequest('/api/check-balances-parallel', {
            method: 'POST',
            body: JSON.stringify({ 
              addresses: allAddresses,
              seedPhrase
            })
          });
          
          if (balanceResponse.ok) {
            const { results } = await balanceResponse.json();
            
            // Cập nhật số lượng địa chỉ đã kiểm tra
            setStats(prev => ({
              ...prev,
              checked: prev.checked + allAddresses.length
            }));
            
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