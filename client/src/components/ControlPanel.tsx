import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, RotateCcw, AlertCircle } from 'lucide-react';
import { WalletCheckStats } from '@shared/schema';

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
  onReset
}: ControlPanelProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Bảng điều khiển</CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center p-2 bg-muted rounded">
            <span className="text-xs text-muted-foreground">Đã tạo</span>
            <span className="text-lg font-bold">{stats.created}</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted rounded">
            <span className="text-xs text-muted-foreground">Đã kiểm tra</span>
            <span className="text-lg font-bold">{stats.checked}</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-primary/10 rounded">
            <span className="text-xs text-primary/80">Tìm thấy</span>
            <span className="text-lg font-bold text-primary">{stats.withBalance}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          onClick={onToggleSearch} 
          className="w-full"
          variant={isSearching ? "destructive" : "default"}
        >
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Dừng lại
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Bắt đầu
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}