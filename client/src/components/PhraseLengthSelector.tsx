import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface PhraseLengthSelectorProps {
  selected: (12 | 24)[];
  onChange: (value: (12 | 24)[]) => void;
}

export function PhraseLengthSelector({
  selected,
  onChange,
}: PhraseLengthSelectorProps) {
  const handleToggle = (value: 12 | 24) => {
    if (selected.includes(value)) {
      // Don't allow removing if it would result in empty selection
      if (selected.length > 1) {
        onChange(selected.filter((item) => item !== value));
      }
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex gap-4 mb-4">
      <Label className="inline-flex items-center bg-white rounded-md py-1 px-2 border border-slate-200 shadow-sm cursor-pointer">
        <Checkbox
          checked={selected.includes(12)}
          onCheckedChange={() => handleToggle(12)}
          className="h-4 w-4 text-secondary rounded mr-1"
        />
        <span className="text-sm">12 từ</span>
      </Label>
      <Label className="inline-flex items-center bg-white rounded-md py-1 px-2 border border-slate-200 shadow-sm cursor-pointer">
        <Checkbox
          checked={selected.includes(24)}
          onCheckedChange={() => handleToggle(24)}
          className="h-4 w-4 text-secondary rounded mr-1"
        />
        <span className="text-sm">24 từ</span>
      </Label>
    </div>
  );
}
