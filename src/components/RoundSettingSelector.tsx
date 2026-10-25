'use client';

import React from 'react';
import { RoundingOptions, RoundingUnit, RoundingMethod } from '@/types/database';
import { Calculator } from 'lucide-react';

interface RoundSettingSelectorProps {
  currentOptions: RoundingOptions;
  onChange: (options: RoundingOptions) => void;
}

interface OptionItem {
  id: string;
  label: string;
  unit: RoundingUnit;
  method: RoundingMethod;
}

const OPTIONS: OptionItem[] = [
  { id: '1-round', label: '1円単位', unit: 1, method: 'round' },
  { id: '100-ceil', label: '100円切上', unit: 100, method: 'ceil' },
  { id: '100-floor', label: '100円切捨', unit: 100, method: 'floor' },
  { id: '500-ceil', label: '500円切上', unit: 500, method: 'ceil' },
];

export const RoundSettingSelector: React.FC<RoundSettingSelectorProps> = ({
  currentOptions,
  onChange,
}) => {
  const currentUnit = currentOptions.unit ?? 1;
  const currentMethod = currentOptions.method ?? 'round';

  return (
    <div className="flex items-center justify-between flex-wrap gap-2 mb-3 px-1">
      <div className="flex items-center text-xs font-bold text-slate-500">
        <Calculator className="w-3.5 h-3.5 mr-1 text-slate-400" />
        <span>端数計算</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {OPTIONS.map((opt) => {
          const isSelected =
            (opt.unit === 1 && currentUnit === 1) ||
            (opt.unit === currentUnit && opt.method === currentMethod);

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange({ unit: opt.unit, method: opt.method })}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
