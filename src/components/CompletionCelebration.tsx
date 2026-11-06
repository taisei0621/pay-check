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
    <div className="bg-zinc-900 border border-emerald-500/40 rounded-2xl p-6 text-zinc-100 shadow-md mb-6 text-center animate-in fade-in duration-300">
      <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-950 border border-emerald-800/80 mb-3 text-emerald-400">
        <Trophy className="w-5 h-5 text-amber-400" />
      </div>

      <div className="flex items-center justify-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <h3 className="text-lg font-bold tracking-tight text-white">
          全員の精算が完了しました
        </h3>
        <Sparkles className="w-4 h-4 text-emerald-400" />
      </div>

      <p className="text-zinc-400 text-xs max-w-md mx-auto">
        {payerName
          ? `${payerName} への立替送金 ¥${totalAmount.toLocaleString()} がすべて回収されました。`
          : `立替総額 ¥${totalAmount.toLocaleString()} の回収がすべて完了しました。`}
      </p>

      <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>相殺・回収完了</span>
        </div>

        {hasPhotos && onOpenSlideshow && (
          <button
            type="button"
            onClick={onOpenSlideshow}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-emerald-950" />
            <span>思い出スライドショーを再生</span>
          </button>
        )}
      </div>
    </div>
  );
};
