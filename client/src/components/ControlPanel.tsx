import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PlayIcon, Square as StopIcon, RefreshCwIcon } from "lucide-react";
import { WalletCheckStats } from "@/types";

interface ControlPanelProps {
  isSearching: boolean;
  stats: WalletCheckStats;
  autoReset: boolean;
  setAutoReset: (value: boolean) => void;
  onToggleSearch: () => void;
  onReset: () => void;
}

export function ControlPanel({
  isSearching,
  stats,
  autoReset,
  setAutoReset,
  onToggleSearch,
  onReset,
}: ControlPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex gap-2">
        <Button
          variant="default"
          className="bg-primary hover:bg-primary/90 text-white"
          onClick={onToggleSearch}
        >
          {isSearching ? (
            <>
              <StopIcon className="h-5 w-5 mr-1" />
              Dừng lại
            </>
          ) : (
            <>
              <PlayIcon className="h-5 w-5 mr-1" />
              Bắt đầu
            </>
          )}
        </Button>

        <Button
          variant="outline"
          className="bg-slate-200 hover:bg-slate-300 text-slate-700"
          onClick={onReset}
        >
          <RefreshCwIcon className="h-5 w-5 mr-1" />
          Reset
        </Button>
      </div>

      <Label className="inline-flex items-center bg-white rounded-md py-1 px-2 border border-slate-200 shadow-sm cursor-pointer">
        <Checkbox
          checked={autoReset}
          onCheckedChange={(checked) => setAutoReset(!!checked)}
          className="h-4 w-4 text-secondary rounded mr-1"
        />
        <span className="text-sm">Tự động reset</span>
      </Label>

      <div className="flex gap-3 ml-auto">
        <div className="text-center">
          <div className="text-xs text-slate-500">Đã tạo:</div>
          <div className="text-lg font-semibold">{stats.created}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500">Đã kiểm tra:</div>
          <div className="text-lg font-semibold">{stats.checked}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500">Có số dư:</div>
          <div className="text-lg font-semibold text-accent">{stats.withBalance}</div>
        </div>
      </div>
    </div>
  );
}
