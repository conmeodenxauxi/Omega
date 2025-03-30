import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet, BlockchainType } from "@shared/schema";
import { getBlockchainIcon, getBlockchainColor } from "./icons/BlockchainIcons";

interface AdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminDialog({ open, onOpenChange }: AdminDialogProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchWallets();
    }
  }, [open]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/query-wallets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: "BlackCat" }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setWallets(data.wallets || []);
    } catch (err) {
      console.error("Failed to fetch wallets:", err);
      setError("Không thể tải dữ liệu ví. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };
  
  const renderBlockchainIcon = (blockchain: BlockchainType, balance: string) => {
    // Kiểm tra số dư bằng cách chuyển đổi sang số và so sánh
    // Sử dụng parseFloat để xử lý các số rất nhỏ và so sánh với 0
    if (parseFloat(balance) <= 0) {
      return null;
    }
    
    const IconComponent = getBlockchainIcon(blockchain);
    const colorClass = getBlockchainColor(blockchain);
    
    return (
      <div className="flex justify-center items-center">
        <IconComponent className={`${colorClass} w-6 h-6`} />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🐈‍⬛ Black Cat</DialogTitle>
          <DialogDescription>
            Xem tất cả ví đã được kiểm tra và có số dư
          </DialogDescription>
        </DialogHeader>

        {loading && <div className="my-4 text-center">Đang tải dữ liệu...</div>}
        
        {error && (
          <div className="my-4 p-3 bg-red-100 text-red-800 rounded-md">
            {error}
          </div>
        )}

        {!loading && !error && wallets.length === 0 && (
          <div className="my-4 text-center">
            Không có dữ liệu ví nào trong database.
          </div>
        )}

        {wallets.length > 0 && (
          <div className="border border-black rounded-lg overflow-hidden">
            <table className="w-full">
              <colgroup>
                <col style={{width: "7%"}} />
                <col style={{width: "70%"}} />
                <col style={{width: "23%"}} />
              </colgroup>
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-3 border-b border-r border-black font-medium text-center"></th>
                  <th className="px-4 py-3 border-b border-r border-black font-medium text-center">Seed Phrase</th>
                  <th className="px-4 py-3 border-b border-black font-medium text-center">Số dư</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((wallet, index) => (
                  <tr key={`${wallet.blockchain}-${wallet.address}-${index}`} 
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-3 border-b border-r border-black text-center">
                      {renderBlockchainIcon(wallet.blockchain as BlockchainType, wallet.balance)}
                    </td>
                    <td className="px-4 py-3 border-b border-r border-black">
                      <div className="font-mono text-sm" title={wallet.seedPhrase}>
                        {wallet.seedPhrase}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-black text-center font-mono whitespace-normal break-words">
                      {wallet.balance === "0" ? "0.00000000" : wallet.balance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}