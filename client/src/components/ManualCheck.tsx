import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Search } from 'lucide-react';
import { seedPhraseSchema } from '@shared/schema';

interface ManualCheckProps {
  onCheck: (seedPhrase: string) => Promise<{ success: boolean; message: string }>;
  isSearching: boolean;
}

export function ManualCheck({ onCheck, isSearching }: ManualCheckProps) {
  const [seedPhrase, setSeedPhrase] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const { toast } = useToast();
  
  const handleCheck = async () => {
    // Xóa thông báo lỗi cũ nếu có
    setError(null);
    
    // Kiểm tra hợp lệ của seed phrase
    try {
      seedPhraseSchema.parse(seedPhrase);
    } catch (err: any) {
      setError(err.message || 'Seed phrase không hợp lệ');
      return;
    }
    
    try {
      setIsChecking(true);
      const result = await onCheck(seedPhrase);
      
      if (result.success) {
        // Hiển thị thông báo thành công
        toast({
          title: 'Kiểm tra hoàn tất',
          description: result.message,
          variant: 'default',
        });
        
        // Reset form sau khi thành công
        setSeedPhrase('');
      } else {
        // Hiển thị thông báo lỗi
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi kiểm tra seed phrase');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kiểm tra thủ công</CardTitle>
        <CardDescription>
          Nhập seed phrase để kiểm tra số dư trên các blockchain đã chọn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Nhập seed phrase 12 hoặc 24 từ, các từ cách nhau bởi dấu cách"
          value={seedPhrase}
          onChange={(e) => setSeedPhrase(e.target.value)}
          rows={3}
          className="font-mono resize-none"
          disabled={isChecking || isSearching}
        />
        
        {error && (
          <div className="bg-destructive/20 p-3 rounded-md flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="text-sm text-destructive">{error}</div>
          </div>
        )}
        
        <div className="text-sm text-muted-foreground min-h-[40px]">
          <strong>Lưu ý:</strong> Seed phrase phải có 12 hoặc 24 từ, các từ cách nhau bởi dấu cách.
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button 
          variant="outline" 
          onClick={() => setSeedPhrase('')}
          disabled={!seedPhrase || isChecking || isSearching}
        >
          Xóa
        </Button>
        <Button 
          onClick={handleCheck}
          disabled={!seedPhrase || isChecking || isSearching}
        >
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang kiểm tra...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Kiểm tra
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}