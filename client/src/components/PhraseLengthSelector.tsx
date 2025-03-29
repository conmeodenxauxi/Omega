import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';

interface PhraseLengthSelectorProps {
  selected: (12 | 24)[];
  onChange: (value: (12 | 24)[]) => void;
}

export function PhraseLengthSelector({
  selected,
  onChange,
}: PhraseLengthSelectorProps) {
  
  const handleValueChange = (value: string[]) => {
    // Convert string values back to numbers
    const numericValues = value
      .map(v => parseInt(v, 10))
      .filter(v => v === 12 || v === 24) as (12 | 24)[];
    
    // Make sure we always have at least one option selected
    if (numericValues.length === 0) {
      return;
    }
    
    onChange(numericValues);
  };

  return (
    <div className="space-y-2">
      <Label>Số từ trong seed phrase</Label>
      <ToggleGroup 
        type="multiple" 
        variant="outline"
        value={selected.map(String)}
        onValueChange={handleValueChange}
        className="justify-start"
      >
        <ToggleGroupItem value="12" aria-label="12 từ">
          12 từ
        </ToggleGroupItem>
        <ToggleGroupItem value="24" aria-label="24 từ">
          24 từ
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}