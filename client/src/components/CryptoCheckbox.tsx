import React from 'react';
import { BlockchainType } from '@shared/schema';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getBlockchainIcon, getBlockchainName, getBlockchainColor } from './icons/BlockchainIcons';

interface CryptoCheckboxProps {
  blockchain: BlockchainType;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CryptoCheckbox({ blockchain, checked, onChange }: CryptoCheckboxProps) {
  const Icon = getBlockchainIcon(blockchain);
  const name = getBlockchainName(blockchain);
  const colorClass = getBlockchainColor(blockchain);
  
  return (
    <div className="flex items-center space-x-2 rounded-lg border p-2 shadow-sm">
      <Checkbox 
        id={`crypto-${blockchain}`} 
        checked={checked} 
        onCheckedChange={onChange}
      />
      <div className="flex items-center space-x-1">
        <Icon className={`h-4 w-4 ${colorClass}`} />
        <Label 
          htmlFor={`crypto-${blockchain}`}
          className="text-sm font-medium"
        >
          {name}
        </Label>
      </div>
    </div>
  );
}