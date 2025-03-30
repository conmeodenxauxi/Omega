import React, { useState, useRef } from "react";
import { Check, RefreshCw, SearchIcon, UserCheck } from "lucide-react";
import { BlockchainType } from "@shared/schema";
import { CryptoCheckbox } from "@/components/CryptoCheckbox";
import { ControlPanel } from "@/components/ControlPanel";
import { PhraseLengthSelector } from "@/components/PhraseLengthSelector";
import { AddressDisplay } from "@/components/AddressDisplay";
import { ManualCheck } from "@/components/ManualCheck";
import { ResultsTable } from "@/components/ResultsTable";
import { useWalletChecker, CheckMode } from "@/lib/hooks/useWalletChecker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  // Thiết lập blockchain và cấu hình chung
  const [selectedBlockchains, setSelectedBlockchains] = useState<BlockchainType[]>([
    "BTC",
    "ETH",
    "BSC",
    "SOL",
    "DOGE",
  ]);
  const [seedPhraseLength, setSeedPhraseLength] = useState<(12 | 24)[]>([12, 24]);
  const [autoReset, setAutoReset] = useState(true);
  
  // Quản lý chế độ hiện tại (AUTO hoặc MANUAL)
  const [activeMode, setActiveMode] = useState<CheckMode>(CheckMode.AUTO);
  
  // Seed phrase thủ công
  const [manualSeedPhraseInput, setManualSeedPhraseInput] = useState<string>('');
  
  // Hook kiểm tra ví với chế độ hiện tại
  const {
    isSearching,
    currentAddresses,
    checkingAddresses,
    walletsWithBalance,
    stats,
    toggleSearching,
    resetStats,
    manualCheck,
    manualCheckResults,
    setManualSeedPhrase,
    isManualChecking
  } = useWalletChecker({
    selectedBlockchains,
    seedPhraseLength,
    autoReset,
    mode: activeMode
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
        <AddressDisplay addresses={checkingAddresses} />
      </div>

      {/* Tabs để chuyển đổi giữa chế độ tự động và thủ công */}
      <div className="mb-6">
        <Tabs defaultValue="auto" onValueChange={(value) => setActiveMode(value as CheckMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={CheckMode.AUTO} className="flex items-center gap-2">
              <SearchIcon className="h-4 w-4" />
              <span>Kiểm tra tự động</span>
            </TabsTrigger>
            <TabsTrigger value={CheckMode.MANUAL} className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span>Kiểm tra thủ công</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={CheckMode.AUTO} className="mt-4">
            {/* Nội dung cho chế độ tự động */}
            <p className="text-sm text-muted-foreground mb-4">
              Chế độ tự động sẽ liên tục tạo và kiểm tra các seed phrase ngẫu nhiên. 
              Ví có số dư sẽ được lưu vào cơ sở dữ liệu một cách âm thầm.
            </p>
          </TabsContent>
          
          <TabsContent value={CheckMode.MANUAL} className="mt-4">
            {/* Nội dung cho chế độ thủ công */}
            <div className="mb-4">
              <ManualCheck onCheck={manualCheck} isSearching={isSearching} />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Chế độ thủ công cho phép kiểm tra một seed phrase cụ thể. Tất cả seed phrase được kiểm tra 
              sẽ được lưu vào cơ sở dữ liệu, và các ví có số dư sẽ được hiển thị ở bên dưới.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Results Table */}
      <div className="mb-8">
        <div className="bg-gray-100 rounded-md p-4 border-2 border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-base">Ví Web3 Có Số Dư Tìm Thấy</h3>
            {walletsWithBalance.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleResetAll} className="h-8 w-8 p-0">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
          <ResultsTable
            walletsWithBalance={activeMode === CheckMode.MANUAL ? manualCheckResults : walletsWithBalance}
          />
        </div>
      </div>
    </div>
  );
}