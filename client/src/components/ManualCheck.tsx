import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ManualCheckProps {
  onCheck: (seedPhrase: string) => Promise<{ success: boolean; message: string }>;
  isSearching: boolean;
}

export function ManualCheck({ onCheck, isSearching }: ManualCheckProps) {
  const [seedPhrase, setSeedPhrase] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!seedPhrase.trim()) {
      toast({
        title: "Hãy nhập seed phrase",
        description: "Vui lòng nhập seed phrase cần kiểm tra",
        variant: "destructive",
      });
      return;
    }
    
    setIsChecking(true);
    try {
      const result = await onCheck(seedPhrase);
      
      toast({
        title: result.success ? "Tìm thấy!" : "Không tìm thấy",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi kiểm tra seed phrase",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
      <h2 className="text-base font-medium mb-3">Kiểm tra Seed Phrase Thủ Công</h2>
      <form className="flex gap-2" onSubmit={handleCheck}>
        <div className="relative flex-1">
          <Input
            placeholder="Nhập seed phrase cần kiểm tra (12 hoặc 24 từ)"
            value={seedPhrase}
            onChange={(e) => setSeedPhrase(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent text-sm"
            disabled={isChecking || isSearching}
          />
        </div>
        <Button 
          type="submit" 
          className="bg-secondary hover:bg-secondary/90 text-white"
          disabled={isChecking || isSearching}
        >
          <div className="flex items-center">
            <SearchIcon className="h-5 w-5 mr-1" />
            Kiểm tra
          </div>
        </Button>
      </form>
    </div>
  );
}
