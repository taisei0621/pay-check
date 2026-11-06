'use client';

import React, { useState } from 'react';
import { detectPaymentType } from '@/lib/utils/payment-calc';
import { ExternalLink, Copy, Check, CreditCard, Send } from 'lucide-react';

interface PaymentActionCardProps {
  destination?: string | null;
  payerName?: string | null;
}

export const PaymentActionCard: React.FC<PaymentActionCardProps> = ({
  destination,
  payerName,
}) => {
  const [copied, setCopied] = useState(false);

  if (!destination || destination.trim().length === 0) {
    return null;
  }

  const paymentInfo = detectPaymentType(destination);

  const handleCopy = async () => {
    const textToCopy = paymentInfo.copyValue || destination;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('以下の情報をコピーしてください:', textToCopy);
    }
  };

  const isLink = Boolean(paymentInfo.actionUrl);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 mb-5 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
            <CreditCard className="w-3.5 h-3.5" />
            <span>{payerName ? `${payerName} への送金先` : '集金・送金先情報'}</span>
          </div>
          <p className="text-zinc-200 font-medium text-sm sm:text-base break-words">
            {destination}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {/* リンクを開くボタン */}
          {isLink && paymentInfo.actionUrl && (
            <a
              href={paymentInfo.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{paymentInfo.label}を開く</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>
          )}

          {/* コピーボタン */}
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
              copied
                ? 'bg-zinc-800 border-emerald-500/50 text-emerald-400'
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>コピー完了</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                <span>{isLink ? 'リンクをコピー' : 'コピー'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
