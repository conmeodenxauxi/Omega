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

      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Button 
            onClick={onToggleSearch} 
            className="h-14 w-14 p-0 flex-shrink-0"
            variant={isSearching ? "destructive" : "default"}
            size="icon"
          >
            {isSearching ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Search className="h-6 w-6" />
            )}
          </Button>
          
          <div className="grid grid-cols-3 gap-2 flex-grow">
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
        </div>
      </CardContent>
    </Card>
  );
}