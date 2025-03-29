import React, { useState } from "react";
import { Check, RefreshCw, SearchIcon } from "lucide-react";
import { BlockchainType } from "@shared/schema";
import { CryptoCheckbox } from "@/components/CryptoCheckbox";
import { ControlPanel } from "@/components/ControlPanel";
import { PhraseLengthSelector } from "@/components/PhraseLengthSelector";
import { AddressDisplay } from "@/components/AddressDisplay";
import { ManualCheck } from "@/components/ManualCheck";
import { ResultsTable } from "@/components/ResultsTable";
import { useWalletChecker } from "@/lib/hooks/useWalletChecker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [selectedBlockchains, setSelectedBlockchains] = useState<BlockchainType[]>([
    "BTC",
    "ETH",
    "BSC",
    "SOL",
    "DOGE",
  ]);
  const [seedPhraseLength, setSeedPhraseLength] = useState<(12 | 24)[]>([12, 24]);
  const [autoReset, setAutoReset] = useState(true);

  const {
    isSearching,
    currentAddresses,
    walletsWithBalance,
    stats,
    toggleSearching,
    resetStats,
    manualCheck,
  } = useWalletChecker({
    selectedBlockchains,
    seedPhraseLength,
    autoReset,
  });

  const toggleBlockchain = (blockchain: BlockchainType, checked: boolean) => {
    if (checked) {
      setSelectedBlockchains((prev) => [...prev, blockchain]);
    } else {
      // Ensure we always have at least one blockchain selected
      if (selectedBlockchains.length > 1) {
        setSelectedBlockchains((prev) =>
          prev.filter((chain) => chain !== blockchain)
        );
      }
    }
  };

  const handleResetAll = () => {
    resetStats();
  };

  return (
    <div className="max-w-lg mx-auto p-4 min-h-screen">
      {/* Header */}
      <header className="mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Ví web3 có số dư</h1>
        <div className="flex items-center">
          <Checkbox 
            id="auto-reset" 
            checked={autoReset} 
            onCheckedChange={(checked) => setAutoReset(!!checked)} 
          />
          <label htmlFor="auto-reset" className="ml-2 text-sm font-medium">
            Tự động reset
          </label>
        </div>
      </header>

      {/* Blockchain Selection */}
      <div className="mb-4 flex justify-between">
        {["BTC", "ETH", "BSC", "SOL", "DOGE"].map((blockchain) => (
          <CryptoCheckbox
            key={blockchain}
            blockchain={blockchain as BlockchainType}
            checked={selectedBlockchains.includes(blockchain as BlockchainType)}
            onChange={(checked) =>
              toggleBlockchain(blockchain as BlockchainType, checked)
            }
          />
        ))}
      </div>

      {/* Control Panel và Phrase Length Selection */}
      <div className="mb-4">
        <ControlPanel
          isSearching={isSearching}
          stats={stats}
          autoReset={autoReset}
          setAutoReset={setAutoReset}
          onToggleSearch={toggleSearching}
          onReset={handleResetAll}
          walletsCount={walletsWithBalance.length}
          seedPhraseLength={seedPhraseLength}
          setSeedPhraseLength={setSeedPhraseLength}
        />
      </div>

      {/* Address Display */}
      <div className="mb-6 p-4 bg-gray-100 rounded-md min-h-[400px] max-w-[600px] mx-auto border-2 border-gray-200">
        <h2 className="font-medium mb-2">Địa chỉ ví đang kiểm tra:</h2>
        <AddressDisplay addresses={currentAddresses} />
      </div>

      {/* Manual Check */}
      <div className="mb-6">
        <ManualCheck onCheck={manualCheck} isSearching={isSearching} />
      </div>

      {/* Results Table */}
      <div className="mb-8">
        <div className="bg-gray-100 rounded-md p-4 border-2 border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-base">Ví Web3 Có Số Dư Tìm Thấy</h3>
            {walletsWithBalance.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleResetAll} className="h-8 w-8 p-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
              </Button>
            )}
          </div>
          <ResultsTable
            walletsWithBalance={walletsWithBalance}
          />
        </div>
      </div>
    </div>
  );
}