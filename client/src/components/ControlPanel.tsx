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
  walletsCount: number;
}

export function ControlPanel({
  isSearching, 
  stats, 
  autoReset,
  setAutoReset,
  onToggleSearch,
  onReset,
  walletsCount
}: ControlPanelProps) {
  return (
    <Card className="mb-4">

      <CardContent className="p-4">
        <div className="grid grid-cols-4 gap-2">
          <Button 
            onClick={onToggleSearch} 
            className="h-14 flex items-center justify-center"
            variant={isSearching ? "destructive" : "default"}
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Dừng
              </>
            ) : (
              "Bắt đầu"
            )}
          </Button>
          
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
            <span className="text-lg font-bold text-primary">{walletsCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}