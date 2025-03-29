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
import { Copy, ExternalLink } from 'lucide-react';
import { WalletWithBalance } from '../types';
import { getBlockchainName, getBlockchainIcon, getBlockchainColor } from './icons/BlockchainIcons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ResultsTableProps {
  walletsWithBalance: WalletWithBalance[];
  onReset: () => void;
}

export function ResultsTable({ walletsWithBalance, onReset }: ResultsTableProps) {
  const { toast } = useToast();
  
  if (walletsWithBalance.length === 0) {
    return null;
  }
  
  const copyToClipboard = (text: string, description = 'Đã sao chép vào clipboard') => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Đã sao chép',
      description: description
    });
  };
  
  const getExplorerLink = (blockchain: string, address: string) => {
    switch (blockchain) {
      case 'BTC':
        return `https://www.blockchain.com/explorer/addresses/btc/${address}`;
      case 'ETH':
        return `https://etherscan.io/address/${address}`;
      case 'BSC':
        return `https://bscscan.com/address/${address}`;
      case 'SOL':
        return `https://solscan.io/account/${address}`;
      case 'DOGE':
        return `https://dogechain.info/address/${address}`;
      default:
        return '#';
    }
  };
  
  return (
    <div className="border rounded-lg p-4 bg-card space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Ví có số dư ({walletsWithBalance.length})</h3>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset danh sách
        </Button>
      </div>
      
      <Table>
        <TableCaption>Danh sách các ví có số dư được tìm thấy</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Blockchain</TableHead>
            <TableHead>Địa chỉ</TableHead>
            <TableHead className="text-right">Số dư</TableHead>
            <TableHead className="text-right">Seed Phrase</TableHead>
            <TableHead className="w-[100px]">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {walletsWithBalance.map((wallet, index) => {
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
                    <span className="truncate max-w-[120px]">{wallet.address}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(wallet.address, 'Đã sao chép địa chỉ')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {wallet.balance} {wallet.blockchain}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  <div className="flex items-center justify-end space-x-2">
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
                <TableCell>
                  <a 
                    href={getExplorerLink(wallet.blockchain, wallet.address)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Xem
                    </Button>
                  </a>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}