import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BlockchainType } from '@shared/schema';
import { WalletAddress } from '../types';
import { getBlockchainName, getBlockchainIcon, getBlockchainColor } from './icons/BlockchainIcons';

interface AddressDisplayProps {
  addresses: WalletAddress[];
}

export function AddressDisplay({ addresses }: AddressDisplayProps) {
  if (!addresses.length) return null;
  
  return (
    <Card>
      <CardContent className="space-y-2 pt-4">
        <div className="space-y-4">
          {addresses.map((walletAddress, index) => {
            const Icon = getBlockchainIcon(walletAddress.blockchain);
            const colorClass = getBlockchainColor(walletAddress.blockchain);
            const blockchain = getBlockchainName(walletAddress.blockchain);
            const batchNumber = walletAddress.batchNumber;
            
            // BTC hiển thị theo cách cũ (dạng danh sách)
            if (walletAddress.blockchain === 'BTC') {
              return (
                <div 
                  key={`${walletAddress.blockchain}-${batchNumber}`}
                  className="border rounded-md p-3"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                    <span className="font-medium">{blockchain}</span>
                    {walletAddress.type && (
                      <span className="text-xs text-muted-foreground">({walletAddress.type})</span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {walletAddress.addresses.map((address, addrIndex) => (
                      <div 
                        key={`${walletAddress.blockchain}-${batchNumber}-${addrIndex}`}
                        className="p-2 bg-muted rounded-md"
                      >
                        <code className="text-xs font-mono truncate block">
                          {address}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            
            // Các blockchain khác hiển thị địa chỉ bên phải
            return (
              <div 
                key={`${walletAddress.blockchain}-${batchNumber}`}
                className="border rounded-md p-3"
              >
                {walletAddress.addresses.map((address, addrIndex) => (
                  <div 
                    key={`${walletAddress.blockchain}-${batchNumber}-${addrIndex}`}
                    className="flex items-center mb-1"
                  >
                    {addrIndex === 0 && (
                      <div className="flex items-center min-w-[100px] mr-2">
                        <Icon className={`h-4 w-4 ${colorClass} mr-2`} />
                        <span className="font-medium">{blockchain}</span>
                      </div>
                    )}
                    {addrIndex !== 0 && <div className="min-w-[100px] mr-2"></div>}
                    
                    <div className="p-2 bg-muted rounded-md flex-1">
                      <code className="text-xs font-mono truncate block">
                        {address}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}