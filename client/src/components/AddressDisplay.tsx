import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BlockchainType } from '@shared/schema';
import { WalletAddress } from '../types';
import { getBlockchainName, getBlockchainIcon, getBlockchainColor } from './icons/BlockchainIcons';

interface AddressDisplayProps {
  addresses: WalletAddress[];
}

export function AddressDisplay({ addresses }: AddressDisplayProps) {
  const { toast } = useToast();
  
  if (!addresses.length) return null;
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Đã sao chép',
      description: 'Địa chỉ đã được sao chép vào clipboard'
    });
  };
  
  const getExplorerLink = (blockchain: BlockchainType, address: string) => {
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
    <Card>
      <CardHeader>
        <CardTitle>Địa chỉ được tạo</CardTitle>
        <CardDescription>
          Danh sách địa chỉ được tạo từ seed phrase trên các blockchain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Accordion type="single" collapsible className="w-full">
          {addresses.map((walletAddress, index) => {
            const Icon = getBlockchainIcon(walletAddress.blockchain);
            const colorClass = getBlockchainColor(walletAddress.blockchain);
            const blockchain = getBlockchainName(walletAddress.blockchain);
            const batchNumber = walletAddress.batchNumber;
            
            return (
              <AccordionItem 
                key={`${walletAddress.blockchain}-${batchNumber}`} 
                value={`${walletAddress.blockchain}-${batchNumber}`}
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                    <span>{blockchain}</span>
                    {walletAddress.type && (
                      <span className="text-xs text-muted-foreground">({walletAddress.type})</span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {walletAddress.addresses.map((address, addrIndex) => (
                      <div 
                        key={`${walletAddress.blockchain}-${batchNumber}-${addrIndex}`}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <code className="text-xs font-mono truncate max-w-[200px]">
                          {address}
                        </code>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(address)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <a 
                            href={getExplorerLink(walletAddress.blockchain, address)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}