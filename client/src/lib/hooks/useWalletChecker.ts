import { useState, useEffect, useCallback, useRef } from 'react';
import { BlockchainType } from '@shared/schema';
import { WalletAddress, WalletWithBalance, WalletCheckStats } from '@/types';
import { createSeedPhrase } from '@/lib/utils/seedPhraseGenerator';
import { getQueryFn, apiRequest } from '@/lib/queryClient';

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
  const [walletsWithBalance, setWalletsWithBalance] = useState<WalletWithBalance[]>([]);
  const [stats, setStats] = useState<WalletCheckStats>({
    created: 0,
    checked: 0,
    withBalance: 0
  });
  
  const currentSeedPhrase = useRef<string>('');
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset statistics and clear results
  const resetStats = useCallback(() => {
    setCurrentAddresses([]);
    setStats({
      created: 0,
      checked: 0,
      withBalance: 0
    });
  }, []);
  
  // Reset only the current addresses without clearing stats
  const resetCurrentAddresses = useCallback(() => {
    setCurrentAddresses([]);
  }, []);
  
  // Generate a new seed phrase and check balances
  const generateAndCheck = useCallback(async () => {
    if (!isSearching || selectedBlockchains.length === 0) return;
    
    try {
      // Kiểm tra lại nếu đã dừng tìm kiếm
      if (!isSearching) {
        console.log("Không còn tìm kiếm, hủy tiến trình");
        return;
      }
      
      // Choose random from selected seed phrase lengths
      const randomIndex = Math.floor(Math.random() * seedPhraseLength.length);
      const wordCount = seedPhraseLength[randomIndex];
      
      // Generate new seed phrase
      const seedPhrase = createSeedPhrase(wordCount);
      currentSeedPhrase.current = seedPhrase;
      
      // Reset current addresses
      resetCurrentAddresses();
      
      // Generate addresses for selected blockchains
      const response = await apiRequest('/api/generate-addresses', {
        method: 'POST',
        body: JSON.stringify({
          seedPhrase,
          blockchains: selectedBlockchains
        })
      });
      
      // Kiểm tra lại nếu đã dừng tìm kiếm
      if (!isSearching) {
        console.log("Không còn tìm kiếm, dừng xử lý");
        return;
      }
      
      if (response.ok) {
        const { addresses } = await response.json();
        setCurrentAddresses(addresses);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          created: prev.created + 1
        }));
        
        // Check balances of generated addresses
        await checkBalances(addresses, seedPhrase);
      }
    } catch (error) {
      console.error('Error generating and checking seed phrase:', error);
    }
    
    // Schedule next check if still searching - kiểm tra lại trạng thái hiện tại
    if (isSearching) {
      searchTimerRef.current = setTimeout(() => {
        // Kiểm tra lại trước khi chạy tiếp
        if (isSearching) {
          generateAndCheck();
        } else {
          console.log("Đã dừng tìm kiếm, không tiếp tục");
        }
      }, 2000);
    } else {
      console.log("Không còn tìm kiếm, không lên lịch tiếp");
    }
  }, [isSearching, selectedBlockchains, seedPhraseLength, resetCurrentAddresses]);
  
  // Check balances of addresses
  const checkBalances = async (addresses: WalletAddress[], seedPhrase: string) => {
    if (!addresses.length) return;
    
    try {
      // Chuẩn bị dữ liệu gửi đi
      const allAddresses = addresses.flatMap(walletAddress => 
        walletAddress.addresses.map(address => ({
          blockchain: walletAddress.blockchain,
          address
        }))
      );
      
      // Gửi yêu cầu kiểm tra số dư
      const response = await apiRequest('/api/check-balances', {
        method: 'POST',
        body: JSON.stringify({ addresses: allAddresses })
      });
      
      if (response.ok) {
        const { results } = await response.json();
        
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
          
          // Nếu chế độ tự động reset, reset lại thống kê
          if (autoReset) {
            resetStats();
          }
        }
      }
    } catch (error) {
      console.error('Error checking balances:', error);
    }
  };
  
  // Bắt đầu hoặc dừng quá trình tìm kiếm
  const toggleSearching = useCallback(() => {
    setIsSearching(prev => {
      const newState = !prev;
      // Nếu dừng lại, xóa timer đang chạy
      if (!newState && searchTimerRef.current) {
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
        
        // Kiểm tra số dư
        await checkBalances(addresses, seedPhrase);
        
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
    if (isSearching) {
      // Nếu đang tìm kiếm, khởi chạy ngay lập tức
      generateAndCheck();
    } else {
      // Clear timer if stopping (đã được xử lý trong toggleSearching)
      console.log("Đã dừng tìm kiếm");
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
    walletsWithBalance,
    stats,
    toggleSearching,
    resetStats,
    manualCheck,
    currentSeedPhrase: currentSeedPhrase.current
  };
}