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
import { Copy, ExternalLink, RefreshCw } from 'lucide-react';
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
        <h3 className="text-lg font-semibold">({walletsWithBalance.length})</h3>
      </div>
      
      <Table>
        <TableCaption>Danh sách các ví có số dư được tìm thấy</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Blockchain</TableHead>
            <TableHead>Seed Phrase</TableHead>
            <TableHead className="text-right">Số dư</TableHead>
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
                    <a 
                      href={getExplorerLink(wallet.blockchain, wallet.address)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 underline hover:no-underline"
                    >
                      {wallet.balance} {wallet.blockchain}
                    </a>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}