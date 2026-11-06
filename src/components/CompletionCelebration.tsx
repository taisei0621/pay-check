'use client';

import React from 'react';
import { Trophy, Sparkles, CheckCircle2, Play } from 'lucide-react';

interface CompletionCelebrationProps {
  payerName?: string | null;
  totalAmount: number;
  onOpenSlideshow?: () => void;
  hasPhotos?: boolean;
}

export const CompletionCelebration: React.FC<CompletionCelebrationProps> = ({
  payerName,
  totalAmount,
  onOpenSlideshow,
  hasPhotos = false,
}) => {
  return (
    <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/20 mb-6 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs mb-3 shadow-inner">
        <Trophy className="w-6 h-6 text-amber-200 stroke-[2.5]" />
      </div>

      <div className="flex items-center justify-center gap-1.5 mb-1">
        <Sparkles className="w-4 h-4 text-amber-200" />
        <h3 className="text-xl font-black tracking-tight">
          全員の精算が完了しました！
        </h3>
        <Sparkles className="w-4 h-4 text-amber-200" />
      </div>

      <p className="text-emerald-100 text-xs sm:text-sm font-medium">
        {payerName
          ? `${payerName}への送金 ¥${totalAmount.toLocaleString()} がすべて回収されました`
          : `立替総額 ¥${totalAmount.toLocaleString()} の回収がすべて完了しました`}
      </p>

      <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-200" />
          <span>精算完了済</span>
        </div>

        {hasPhotos && onOpenSlideshow && (
          <button
            type="button"
            onClick={onOpenSlideshow}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold shadow-md transition cursor-pointer active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-emerald-800" />
            <span>思い出スライドショーを再生</span>
          </button>
        )}
      </div>
    </div>
  );
};
