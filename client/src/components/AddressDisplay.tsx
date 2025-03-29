import React from "react";
import { BLOCKCHAIN_ICONS } from "@/lib/utils/blockchains";
import { WalletAddress } from "@/types";

interface AddressDisplayProps {
  addresses: WalletAddress[];
}

export function AddressDisplay({ addresses }: AddressDisplayProps) {
  if (addresses.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <h2 className="text-sm font-medium text-slate-500 mb-2">
          Địa chỉ đang kiểm tra:
        </h2>
        <div className="text-sm text-slate-400 italic">
          Chưa có địa chỉ nào đang được kiểm tra
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
      <h2 className="text-sm font-medium text-slate-500 mb-2">
        Địa chỉ đang kiểm tra:
      </h2>
      <div className="space-y-3">
        {addresses.map((walletAddress, index) => {
          const blockchainIcon = BLOCKCHAIN_ICONS.find(
            (icon) => icon.id === walletAddress.blockchain
          );

          return (
            <div key={`${walletAddress.blockchain}-${walletAddress.batchNumber}-${index}`} className="text-sm">
              <div className="font-medium flex items-center">
                {blockchainIcon?.icon}
                <span className="ml-1">
                  {walletAddress.blockchain} Batch {walletAddress.batchNumber}:
                </span>
              </div>
              <div className="pl-5 text-xs font-mono text-slate-700 mt-1">
                {walletAddress.type && <div>{walletAddress.type}:</div>}
                {walletAddress.addresses.map((address, addrIndex) => (
                  <div key={addrIndex} className="truncate">
                    {address}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
