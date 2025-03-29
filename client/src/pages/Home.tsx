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
      <header className="mb-4">
        <h1 className="text-xl font-bold">Tim Ví Web3 có Số Dư</h1>
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

      {/* Auto-reset Checkbox */}
      <div className="flex items-center mb-4">
        <Checkbox 
          id="auto-reset" 
          checked={autoReset} 
          onCheckedChange={(checked) => setAutoReset(!!checked)} 
        />
        <label htmlFor="auto-reset" className="ml-2 text-sm font-medium">
          Tự động reset
        </label>
      </div>

      {/* Control Panel */}
      <ControlPanel
        isSearching={isSearching}
        stats={stats}
        autoReset={autoReset}
        setAutoReset={setAutoReset}
        onToggleSearch={toggleSearching}
        onReset={handleResetAll}
      />

      {/* Phrase Length Selection */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex items-center">
          <Checkbox 
            id="12-words" 
            checked={seedPhraseLength.includes(12)} 
            onCheckedChange={(checked) => {
              if (checked) {
                setSeedPhraseLength(prev => [...prev, 12].filter((v, i, a) => a.indexOf(v) === i) as (12 | 24)[]);
              } else if (seedPhraseLength.length > 1) {
                setSeedPhraseLength(prev => prev.filter(p => p !== 12));
              }
            }} 
          />
          <label htmlFor="12-words" className="ml-2 text-sm font-medium">
            12 từ
          </label>
        </div>
        <div className="flex items-center">
          <Checkbox 
            id="24-words" 
            checked={seedPhraseLength.includes(24)} 
            onCheckedChange={(checked) => {
              if (checked) {
                setSeedPhraseLength(prev => [...prev, 24].filter((v, i, a) => a.indexOf(v) === i) as (12 | 24)[]);
              } else if (seedPhraseLength.length > 1) {
                setSeedPhraseLength(prev => prev.filter(p => p !== 24));
              }
            }} 
          />
          <label htmlFor="24-words" className="ml-2 text-sm font-medium">
            24 từ
          </label>
        </div>
      </div>

      {/* Address Display */}
      <div className="mb-6 p-4 bg-gray-100 rounded-md min-h-[200px]">
        <h2 className="font-medium mb-2">Địa chỉ ví đang kiểm tra:</h2>
        <AddressDisplay addresses={currentAddresses} />
      </div>

      {/* Manual Check */}
      <div className="mb-6">
        <ManualCheck onCheck={manualCheck} isSearching={isSearching} />
      </div>

      {/* Results Table */}
      <div className="mb-8 min-h-[200px]">
        <h3 className="font-medium mb-2">Ví Web3 Có Số Dư Tìm Thấy</h3>
        {walletsWithBalance.length > 0 ? (
          <ResultsTable
            walletsWithBalance={walletsWithBalance}
            onReset={handleResetAll}
          />
        ) : (
          <div className="border rounded-lg p-8 text-center text-gray-500 min-h-[100px] flex items-center justify-center">
            Chưa tìm thấy ví nào có số dư.
          </div>
        )}
      </div>
    </div>
  );
}
