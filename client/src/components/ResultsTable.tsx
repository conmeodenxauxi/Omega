import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { WalletWithBalance } from '../types';
import { getBlockchainName, getBlockchainIcon, getBlockchainColor } from './icons/BlockchainIcons';
import { useToast } from '@/hooks/use-toast';
interface ResultsTableProps {
  walletsWithBalance: WalletWithBalance[];
}

export function ResultsTable({ walletsWithBalance }: ResultsTableProps) {
  const { toast } = useToast();
  
  const copyToClipboard = (text: string, description = 'Đã sao chép vào clipboard') => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Đã sao chép',
      description: description
    });
  };
  
  return (
    <div className="border rounded-lg p-4 bg-card">
      <Table>
        {/* Đã xóa dòng danh sách các ví có số dư */}
        <TableHeader>
          <TableRow>
            <TableHead>Blockchain</TableHead>
            <TableHead>Seed Phrase</TableHead>
            <TableHead className="text-right">Số dư</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {walletsWithBalance.length > 0 ? (
            walletsWithBalance.map((wallet, index) => {
              const Icon = getBlockchainIcon(wallet.blockchain);
              const colorClass = getBlockchainColor(wallet.blockchain);
              
              return (
                <TableRow key={`${wallet.blockchain}-${wallet.address}-${index}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Icon className={`h-4 w-4 ${colorClass}`} />
                      <span>{getBlockchainName(wallet.blockchain)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="truncate max-w-[150px]">{wallet.seedPhrase}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(wallet.seedPhrase, 'Đã sao chép seed phrase')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <div className="flex items-center justify-end space-x-2">
                      <span>{wallet.balance} {wallet.blockchain}</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-gray-500 py-4">
                Chưa tìm thấy ví nào có số dư.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}