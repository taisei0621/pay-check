'use client';

import React from 'react';
import { SettlementSummary, PaymentSummary } from '@/types/database';
import { UserCheck, Trophy, Receipt } from 'lucide-react';

interface SummaryCardProps {
  settlement?: SettlementSummary;
  // 後方互換用
  summary?: PaymentSummary;
  amountPerPerson?: number;
  receiptImage?: string | null;
  onOpenReceipt?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  settlement,
  summary,
  amountPerPerson = 0,
  receiptImage,
  onOpenReceipt,
}) => {
  const payerName = settlement?.payerName || null;
  const totalAmount = settlement?.totalAmount ?? ((summary?.totalParticipants || 0) * amountPerPerson);
  const perPerson = settlement?.perPersonAmount ?? amountPerPerson;
  const remainingAmount = settlement?.remainingAmount ?? (summary?.remainingAmount || 0);
  const targetAmount = settlement?.collectTargetAmount ?? (summary?.totalParticipants || 0) * amountPerPerson;
  const paidCount = settlement?.paidCount ?? (summary?.paidCount || 0);
  const totalCount = settlement?.collectTargetCount ?? (summary?.totalParticipants || 0);
  const progressPercentage = settlement?.progressPercentage ?? (summary?.progressPercentage || 0);

  const isAllPaid = totalCount > 0 && remainingAmount === 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 mb-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          {payerName ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>立替者: {payerName}</span>
            </div>
          ) : (
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
              精算状況
            </span>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-100 tracking-tight font-mono">
              ¥{totalAmount.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-400">総額</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* レシート確認ボタン */}
          {receiptImage && onOpenReceipt && (
            <button
              type="button"
              onClick={onOpenReceipt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              <span>レシート明細</span>
            </button>
          )}

          <div className="text-right">
            <div className="flex items-center justify-end gap-1 mb-0.5">
              {isAllPaid && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
              <span className="text-xs font-medium text-zinc-400">
                {isAllPaid ? '回収完了' : '回収進捗'}
              </span>
            </div>
            <p
              className={`text-2xl font-black font-mono tracking-tight ${
                isAllPaid ? 'text-emerald-400' : 'text-zinc-100'
              }`}
            >
              {progressPercentage}%
            </p>
          </div>
        </div>
      </div>

      {/* プログレスバー */}
      <div className="w-full bg-zinc-950 rounded-full h-2 mb-5 overflow-hidden p-0.5 border border-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isAllPaid ? 'bg-emerald-400' : 'bg-zinc-200'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* サマリーグリッド */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-zinc-950/70 rounded-xl p-3 border border-zinc-800/80">
          <span className="text-[11px] text-zinc-500 font-medium block mb-0.5">
            1人あたり
          </span>
          <p className="text-base font-bold text-zinc-100 font-mono">
            ¥{perPerson.toLocaleString()}
          </p>
        </div>

        <div className="bg-zinc-950/70 rounded-xl p-3 border border-zinc-800/80">
          <span className="text-[11px] text-zinc-500 font-medium block mb-0.5">
            未回収額
          </span>
          <p className="text-base font-bold text-amber-400 font-mono">
            ¥{remainingAmount.toLocaleString()}
          </p>
        </div>

        <div className="bg-zinc-950/70 rounded-xl p-3 border border-zinc-800/80">
          <span className="text-[11px] text-zinc-500 font-medium block mb-0.5">
            回収状況
          </span>
          <p className="text-base font-bold text-emerald-400 font-mono">
            {paidCount} / {totalCount} 名
          </p>
        </div>

        <div className="bg-zinc-950/70 rounded-xl p-3 border border-zinc-800/80">
          <span className="text-[11px] text-zinc-500 font-medium block mb-0.5">
            回収対象額
          </span>
          <p className="text-base font-bold text-zinc-300 font-mono">
            ¥{targetAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 端数丸め差額 */}
      {settlement?.payerDiff !== undefined && settlement.payerDiff !== 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
          <span className="text-zinc-500">端数丸め差額</span>
          <span
            className={`font-semibold font-mono ${
              settlement.payerDiff > 0 ? 'text-zinc-300' : 'text-amber-400'
            }`}
          >
            {settlement.payerDiff > 0
              ? `+¥${settlement.payerDiff.toLocaleString()} 立替者余剰`
              : `-¥${Math.abs(settlement.payerDiff).toLocaleString()} 立替者負担`}
          </span>
        </div>
      )}
    </div>
  );
};
