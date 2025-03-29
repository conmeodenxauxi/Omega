import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BlockchainType, blockchainSchema } from '@shared/schema';
import { WalletAddress } from '../types';
import { getBlockchainName, getBlockchainIcon, getBlockchainColor } from './icons/BlockchainIcons';

interface AddressDisplayProps {
  addresses: WalletAddress[];
}

export function AddressDisplay({ addresses }: AddressDisplayProps) {
  // Tạo danh sách tất cả các blockchain để hiển thị
  const allBlockchains: BlockchainType[] = ['BTC', 'ETH', 'BSC', 'SOL', 'DOGE'];
  
  // Map địa chỉ sẵn có theo blockchain để dễ truy cập
  const addressMap = new Map<BlockchainType, WalletAddress>();
  addresses.forEach(addr => {
    addressMap.set(addr.blockchain, addr);
  });
  
  return (
    <Card>
      <CardContent className="space-y-2 pt-4">
        <div className="space-y-4">
          {allBlockchains.map((blockchain) => {
            const Icon = getBlockchainIcon(blockchain);
            const colorClass = getBlockchainColor(blockchain);
            const blockchainName = getBlockchainName(blockchain);
            const walletAddress = addressMap.get(blockchain);
            
            // BTC hiển thị cách khác (dạng danh sách dọc)
            if (blockchain === 'BTC') {
              // Tạo mảng loại địa chỉ BTC
              const btcTypes = ['Legacy', 'Nested SegWit', 'Native SegWit'];
              
              return (
                <div 
                  key={`${blockchain}`}
                  className="border rounded-md p-3"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                    <span className="font-medium">{blockchainName}</span>
                    <span className="text-xs text-muted-foreground">(3 dạng)</span>
                  </div>
                  
                  <div className="space-y-1">
                    {btcTypes.map((addressType, index) => {
                      const address = walletAddress?.addresses[index] || '';
                      
                      return (
                        <div 
                          key={`BTC-${addressType}`}
                          className="p-2 bg-muted rounded-md overflow-hidden"
                        >
                          <div className="flex items-center mb-1">
                            <span className="text-xs font-medium mr-2 min-w-[100px]">{addressType}:</span>
                          </div>
                          {address ? (
                            <code className="text-xs font-mono w-full inline-block truncate">
                              {address}
                            </code>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              Chưa có địa chỉ
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            
            // Các blockchain khác hiển thị địa chỉ bên phải
            return (
              <div 
                key={`${blockchain}`}
                className="border rounded-md p-3"
              >
                <div className="flex items-center mb-1">
                  <div className="flex items-center min-w-[100px] mr-2">
                    <Icon className={`h-4 w-4 ${colorClass} mr-2`} />
                    <span className="font-medium">{blockchainName}</span>
                  </div>
                  
                  <div className="p-2 bg-muted rounded-md flex-1 overflow-hidden">
                    {walletAddress?.addresses[0] ? (
                      <code className="text-xs font-mono w-full inline-block truncate">
                        {walletAddress.addresses[0]}
                      </code>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        Chưa có địa chỉ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}