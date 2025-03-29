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
    <Card className="h-[400px] overflow-auto">
      <CardContent className="pt-2">
        <div className="grid h-full gap-2">
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
                  className="border rounded-md p-2 h-[150px]"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                    <span className="font-medium">{blockchainName}</span>
                    <span className="text-xs text-muted-foreground">(3 dạng)</span>
                  </div>
                  
                  <div className="grid grid-rows-3 gap-1 h-[110px]">
                    {btcTypes.map((addressType, index) => {
                      const address = walletAddress?.addresses[index] || '';
                      
                      return (
                        <div 
                          key={`BTC-${addressType}`}
                          className="flex items-center gap-2 h-[32px]"
                        >
                          <div className="flex items-center min-w-[100px] w-[100px] shrink-0">
                            <span className="text-xs font-medium">{addressType}:</span>
                          </div>
                          <div className="p-1 bg-muted rounded-md flex-1 overflow-hidden h-[28px] w-[200px]">
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
                className="border rounded-md p-2 h-[45px]"
              >
                <div className="flex items-center h-[30px]">
                  <div className="flex items-center min-w-[100px] w-[100px] shrink-0 mr-2">
                    <Icon className={`h-4 w-4 ${colorClass} mr-2`} />
                    <span className="font-medium">{blockchainName}</span>
                  </div>
                  
                  <div className="p-1 bg-muted rounded-md flex-1 overflow-hidden h-[28px] w-[200px]">
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