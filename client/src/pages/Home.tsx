import React, { useState } from "react";
import { CogIcon, FileTextIcon } from "lucide-react";
import { BlockchainType } from "@shared/schema";
import { CryptoCheckbox } from "@/components/CryptoCheckbox";
import { ControlPanel } from "@/components/ControlPanel";
import { PhraseLengthSelector } from "@/components/PhraseLengthSelector";
import { AddressDisplay } from "@/components/AddressDisplay";
import { ManualCheck } from "@/components/ManualCheck";
import { ResultsTable } from "@/components/ResultsTable";
import { useWalletChecker } from "@/lib/hooks/useWalletChecker";

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
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button className="mr-2 text-slate-500 hover:text-slate-700">
            <CogIcon className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Tìm Ví Web3 có Số Dư</h1>
        </div>
        <button className="text-slate-500 hover:text-slate-700">
          <FileTextIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Blockchain Selection */}
      <div className="mb-4 flex flex-wrap gap-2">
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
      <PhraseLengthSelector
        selected={seedPhraseLength}
        onChange={setSeedPhraseLength}
      />

      {/* Address Display */}
      <AddressDisplay addresses={currentAddresses} />

      {/* Manual Check */}
      <ManualCheck onCheck={manualCheck} isSearching={isSearching} />

      {/* Results Table */}
      <ResultsTable
        walletsWithBalance={walletsWithBalance}
        onReset={handleResetAll}
      />
    </div>
  );
}
