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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-3xl p-5 sm:p-6 border border-blue-100 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-1">
            <CreditCard className="w-4 h-4" />
            <span>{payerName ? `${payerName}への送金先` : '集金・送金先'}</span>
          </div>
          <p className="text-slate-800 font-bold text-sm sm:text-base break-words">
            {destination}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {/* リンクを開くアクションボタン */}
          {isLink && paymentInfo.actionUrl && (
            <a
              href={paymentInfo.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              <span>{paymentInfo.label}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-80" />
            </a>
          )}

          {/* コピーボタン */}
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer border ${
              copied
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 stroke-[3]" />
                <span>コピー完了</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                <span>{isLink ? 'リンクをコピー' : 'コピー'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
