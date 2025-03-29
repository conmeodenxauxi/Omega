import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, RotateCcw, AlertCircle } from 'lucide-react';
import { WalletCheckStats } from '../types';

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
    <Card>
      <CardHeader>
        <CardTitle>Bảng điều khiển</CardTitle>
        <CardDescription>Kiểm soát quá trình tìm kiếm ví</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Đã tạo</span>
            <span className="text-2xl font-bold">{stats.created}</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Đã kiểm tra</span>
            <span className="text-2xl font-bold">{stats.checked}</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-primary/20 rounded-lg">
            <span className="text-sm font-medium text-primary">Tìm thấy</span>
            <span className="text-2xl font-bold text-primary">{stats.withBalance}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="auto-reset" 
            checked={autoReset}
            onCheckedChange={setAutoReset}
          />
          <Label htmlFor="auto-reset">Tự động reset khi tìm thấy ví có số dư</Label>
        </div>
        
        {stats.withBalance > 0 && (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-400">
              Đã tìm thấy {stats.withBalance} ví có số dư. Kiểm tra danh sách kết quả phía dưới.
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onReset} disabled={isSearching}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button onClick={onToggleSearch} disabled={isSearching && !stats.created}>
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Dừng tìm kiếm
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Bắt đầu tìm kiếm
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}