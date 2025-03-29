import { useState, useCallback, useEffect, useRef } from "react";
import { BlockchainType } from "@shared/schema";
import { generateSeedPhrase, validateSeedPhrase } from "@/lib/utils/seed";
import { generateAddressesFromSeed, checkBalances } from "@/lib/utils/wallet";
import { WalletAddress, WalletCheckStats, WalletWithBalance } from "@/types";

interface UseWalletCheckerProps {
  selectedBlockchains: BlockchainType[];
  seedPhraseLength: (12 | 24)[];
  autoReset: boolean;
}

export function useWalletChecker({
  selectedBlockchains,
  seedPhraseLength,
  autoReset,
}: UseWalletCheckerProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [currentAddresses, setCurrentAddresses] = useState<WalletAddress[]>([]);
  const [walletsWithBalance, setWalletsWithBalance] = useState<WalletWithBalance[]>([]);
  const [stats, setStats] = useState<WalletCheckStats>({
    created: 0,
    checked: 0,
    withBalance: 0,
  });
  const searchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetStats = useCallback(() => {
    setStats({
      created: 0,
      checked: 0,
      withBalance: 0,
    });
    setCurrentAddresses([]);
  }, []);

  const stopSearching = useCallback(() => {
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }
    setIsSearching(false);
  }, []);

  const checkSeedPhrase = useCallback(async (seedPhrase: string) => {
    if (!validateSeedPhrase(seedPhrase)) {
      return false;
    }

    try {
      // Generate addresses for the provided seed phrase
      const addresses = await generateAddressesFromSeed(
        seedPhrase,
        selectedBlockchains
      );
      
      setCurrentAddresses(addresses);
      setStats(prev => ({
        ...prev,
        created: prev.created + 1,
      }));
      
      // Check balances for the generated addresses
      const walletsWithBalanceResult = await checkBalances(addresses);
      
      setStats(prev => ({
        ...prev,
        checked: prev.checked + 1,
      }));
      
      // If we found wallets with balance, add them to our list
      if (walletsWithBalanceResult.length > 0) {
        setWalletsWithBalance(prev => [...prev, ...walletsWithBalanceResult]);
        setStats(prev => ({
          ...prev,
          withBalance: prev.withBalance + walletsWithBalanceResult.length,
        }));
        
        // If auto-reset is enabled, reset stats when we find a wallet with balance
        if (autoReset) {
          resetStats();
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking seed phrase:", error);
      return false;
    }
  }, [selectedBlockchains, autoReset, resetStats]);

  const startSearching = useCallback(() => {
    setIsSearching(true);
    
    // Start the search interval
    searchIntervalRef.current = setInterval(() => {
      // Randomly pick between 12 and 24 words based on user preference
      const wordCount = seedPhraseLength[Math.floor(Math.random() * seedPhraseLength.length)];
      const newSeedPhrase = generateSeedPhrase(wordCount);
      
      checkSeedPhrase(newSeedPhrase);
    }, 1000); // 1 second interval for demo, adjust as needed
  }, [seedPhraseLength, checkSeedPhrase]);

  const toggleSearching = useCallback(() => {
    if (isSearching) {
      stopSearching();
    } else {
      startSearching();
    }
  }, [isSearching, startSearching, stopSearching]);

  const manualCheck = useCallback(async (seedPhrase: string) => {
    if (!validateSeedPhrase(seedPhrase)) {
      return { success: false, message: "Invalid seed phrase" };
    }
    
    const success = await checkSeedPhrase(seedPhrase);
    return { 
      success, 
      message: success 
        ? "Tìm thấy ví có số dư" 
        : "Không tìm thấy ví nào có số dư" 
    };
  }, [checkSeedPhrase]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
      }
    };
  }, []);

  return {
    isSearching,
    currentAddresses,
    walletsWithBalance,
    stats,
    toggleSearching,
    resetStats,
    manualCheck,
  };
}
