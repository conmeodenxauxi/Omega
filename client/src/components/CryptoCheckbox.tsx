import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BlockchainType } from "@shared/schema";
import { getBlockchainIcon } from "@/lib/utils/blockchains";

interface CryptoCheckboxProps {
  blockchain: BlockchainType;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CryptoCheckbox({ blockchain, checked, onChange }: CryptoCheckboxProps) {
  const blockchainIcon = getBlockchainIcon(blockchain);

  return (
    <Label className="inline-flex items-center bg-white rounded-md py-1 px-2 border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50">
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        className="mr-1 h-4 w-4 rounded text-secondary"
      />
      <span className="flex items-center text-sm">
        {blockchainIcon && React.createElement(blockchainIcon.icon, { className: "h-4 w-4" })}
        <span className="ml-1">{blockchainIcon?.name}</span>
      </span>
    </Label>
  );
}
