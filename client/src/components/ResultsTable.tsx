import React from "react";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBlockchainIcon } from "@/lib/utils/blockchains";
import { WalletWithBalance } from "@/types";

interface ResultsTableProps {
  walletsWithBalance: WalletWithBalance[];
  onReset: () => void;
}

export function ResultsTable({ walletsWithBalance, onReset }: ResultsTableProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-medium">Ví Web3 Có Số Dư Tìm Thấy</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          className="text-slate-500 hover:text-slate-700"
        >
          <RefreshCwIcon className="h-5 w-5" />
        </Button>
      </div>

      {walletsWithBalance.length === 0 ? (
        <div className="text-center py-6 text-slate-500">
          Chưa tìm thấy ví nào có số dư.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="pb-2">Loại</th>
                <th className="pb-2">Địa chỉ</th>
                <th className="pb-2 text-right">Số dư</th>
                <th className="pb-2 text-right">Seed Phrase</th>
              </tr>
            </thead>
            <tbody>
              {walletsWithBalance.map((wallet, index) => {
                const blockchainIcon = getBlockchainIcon(wallet.blockchain);
                return (
                  <tr key={index} className="border-b border-slate-100 text-sm">
                    <td className="py-2">
                      <div className="flex items-center">
                        {blockchainIcon?.icon}
                        <span className="ml-1">{blockchainIcon?.name}</span>
                      </div>
                    </td>
                    <td className="py-2 font-mono text-xs truncate max-w-[160px]">
                      {wallet.address}
                    </td>
                    <td className="py-2 text-right font-semibold text-accent">
                      {wallet.balance}
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(wallet.seedPhrase);
                        }}
                      >
                        Copy
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
