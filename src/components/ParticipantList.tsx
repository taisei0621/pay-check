'use client';

import React from 'react';
import { PaymentEntity, PaymentTransferItem } from '@/types/database';
import { Check, Clock, Loader2, ArrowRight, UserCheck } from 'lucide-react';

interface ParticipantListProps {
  payments: PaymentEntity[];
  transfers?: PaymentTransferItem[];
  payerName?: string | null;
  baseAmount?: number;
  onToggleStatus: (paymentId: string, currentStatus: boolean) => Promise<void>;
  loadingId: string | null;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  payments,
  transfers,
  payerName,
  baseAmount = 0,
  onToggleStatus,
  loadingId,
}) => {
  if (payments.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-2xl p-8 text-center border border-zinc-800 text-zinc-500 text-xs">
        参加者が登録されていません
      </div>
    );
  }

  // transfer map 作成
  const transferMap = new Map<string, PaymentTransferItem>();
  if (transfers) {
    transfers.forEach((t) => transferMap.set(t.id, t));
  }

  const effectivePayer = payerName?.trim() || null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-6 shadow-sm">
      <div className="px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/40 flex justify-between items-center">
        <h3 className="font-semibold text-zinc-200 text-xs">
          送金指示・回収ステータス
        </h3>
        <span className="text-[11px] text-zinc-500">ボタンタップで受取切替</span>
      </div>

      <ul className="divide-y divide-zinc-800/80">
        {payments.map((payment) => {
          const isLoading = loadingId === payment.id;
          const transfer = transferMap.get(payment.id);

          const isPayer =
            transfer?.isPayer ??
            Boolean(
              effectivePayer &&
                payment.participant_name.trim().toLowerCase() === effectivePayer.toLowerCase()
            );

          const amount =
            transfer?.amount ??
            (typeof payment.custom_amount === 'number' && payment.custom_amount >= 0
              ? payment.custom_amount
              : baseAmount);

          const toName = transfer?.toName ?? (effectivePayer || '立替者');

          return (
            <li
              key={payment.id}
              className={`flex items-center justify-between p-4 sm:px-5 transition ${
                isPayer
                  ? 'bg-zinc-950/60'
                  : payment.is_paid
                  ? 'bg-emerald-950/15'
                  : 'hover:bg-zinc-950/30'
              }`}
            >
              {/* 送金指示 */}
              <div className="flex items-center gap-3 min-w-0 mr-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isPayer
                      ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      : payment.is_paid
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {isPayer ? (
                    <UserCheck className="w-3.5 h-3.5" />
                  ) : (
                    payment.participant_name.slice(0, 1)
                  )}
                </div>

                <div className="min-w-0">
                  {isPayer ? (
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-zinc-200 text-sm">
                          {payment.participant_name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                          立替者
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">立替済み</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap text-sm">
                        <span className="font-medium text-zinc-200">
                          {payment.participant_name}
                        </span>
                        <ArrowRight className="w-3 h-3 text-zinc-600 shrink-0" />
                        <span className="text-zinc-400 text-xs font-normal">
                          {toName}
                        </span>
                      </div>
                      <p className="text-xs font-semibold font-mono text-zinc-300 mt-0.5">
                        ¥{amount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 切替ボタン */}
              {isPayer ? (
                <div className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 border border-zinc-800 bg-zinc-950/60 shrink-0">
                  立替完了
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => onToggleStatus(payment.id, payment.is_paid)}
                  className={`relative inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 min-w-[90px] shrink-0 cursor-pointer ${
                    isLoading
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : payment.is_paid
                      ? 'bg-emerald-950 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                  aria-label={`${payment.participant_name}の受取状態を切り替える`}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                  ) : payment.is_paid ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" />
                      <span>受取済</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>未受取</span>
                    </span>
                  )}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
