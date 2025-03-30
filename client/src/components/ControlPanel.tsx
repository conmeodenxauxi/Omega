import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, RotateCcw, AlertCircle } from 'lucide-react';
import { WalletCheckStats } from '@shared/schema';
import { Checkbox } from '@/components/ui/checkbox';

interface ControlPanelProps {
  isSearching: boolean;
  stats: WalletCheckStats;
  autoReset: boolean;
  setAutoReset: (value: boolean) => void;
  onToggleSearch: () => void;
  onReset: () => void;
  walletsCount?: number;
  seedPhraseLength: (12 | 24)[];
  setSeedPhraseLength: (value: (12 | 24)[]) => void;
}

export function ControlPanel({
  isSearching, 
  stats, 
  autoReset,
  setAutoReset,
  onToggleSearch,
  onReset,
  walletsCount = 0,
  seedPhraseLength,
  setSeedPhraseLength
}: ControlPanelProps) {
  return (
    <Card className="mb-4 border-2 border-gray-200">
      <CardHeader className="pb-0 py-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium">Kiểm tra tự động</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Checkbox 
                id="12-words" 
                checked={seedPhraseLength.includes(12)} 
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSeedPhraseLength([...seedPhraseLength, 12].filter((v, i, a) => a.indexOf(v) === i) as (12 | 24)[]);
                  } else if (seedPhraseLength.length > 1) {
                    setSeedPhraseLength(seedPhraseLength.filter(p => p !== 12));
                  }
                }} 
              />
              <label htmlFor="12-words" className="ml-2 text-xs font-medium">
                12 từ
              </label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="24-words" 
                checked={seedPhraseLength.includes(24)} 
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSeedPhraseLength([...seedPhraseLength, 24].filter((v, i, a) => a.indexOf(v) === i) as (12 | 24)[]);
                  } else if (seedPhraseLength.length > 1) {
                    setSeedPhraseLength(seedPhraseLength.filter(p => p !== 24));
                  }
                }} 
              />
              <label htmlFor="24-words" className="ml-2 text-xs font-medium">
                24 từ
              </label>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid grid-cols-4 gap-2">
          <Button 
            onClick={onToggleSearch} 
            className="h-14 flex items-center justify-center"
            variant={isSearching ? "destructive" : "default"}
          >
            {isSearching ? (
              "Dừng"
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