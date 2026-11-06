'use client';

import React, { useEffect, useState } from 'react';
import { getSavedDestinations } from '@/lib/utils/saved-destinations';
import { Clock } from 'lucide-react';

interface SavedDestinationChipsProps {
  onSelect: (destination: string) => void;
}

export const SavedDestinationChips: React.FC<SavedDestinationChipsProps> = ({
  onSelect,
}) => {
  const [savedList, setSavedList] = useState<string[]>([]);

  useEffect(() => {
    setSavedList(getSavedDestinations());
  }, []);

  if (savedList.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mb-1.5">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span>よく使う送金先から選択:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {savedList.map((dest, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(dest)}
            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200/80 transition cursor-pointer max-w-xs truncate"
            title={dest}
          >
            {dest}
          </button>
        ))}
      </div>
    </div>
  );
};
