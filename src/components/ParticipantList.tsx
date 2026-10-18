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
      <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm text-slate-400 text-sm">
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
    <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 text-sm">精算・送金一覧</h3>
        <span className="text-xs text-slate-400 font-medium">タップで切替</span>
      </div>

      <ul className="divide-y divide-slate-100">
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
              className={`flex items-center justify-between p-4 sm:px-6 transition-all duration-200 ${
                isPayer
                  ? 'bg-indigo-50/20'
                  : payment.is_paid
                  ? 'bg-emerald-50/20'
                  : 'hover:bg-slate-50/60'
              }`}
            >
              {/* 送金指示（誰 ➡️ 誰へ ¥XXX） */}
              <div className="flex items-center space-x-3 min-w-0 mr-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                    isPayer
                      ? 'bg-indigo-600 text-white'
                      : payment.is_paid
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isPayer ? (
                    <UserCheck className="w-4 h-4" />
                  ) : (
                    payment.participant_name.slice(0, 1)
                  )}
                </div>

                <div className="min-w-0">
                  {isPayer ? (
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">
                          {payment.participant_name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-700">
                          立替者
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">立替済み</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap text-sm">
                        <span className="font-bold text-slate-900">
                          {payment.participant_name}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600 font-medium">{toName}</span>
                      </div>
                      <p className="text-xs font-bold text-blue-600 mt-0.5">
                        ¥{amount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ステータス切替ボタンまたは立替者表示 */}
              {isPayer ? (
                <div className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                  精算済
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => onToggleStatus(payment.id, payment.is_paid)}
                  className={`relative inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-xs min-w-[95px] shrink-0 cursor-pointer ${
                    isLoading
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : payment.is_paid
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                  aria-label={`${payment.participant_name}の支払い状態を切り替える`}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  ) : payment.is_paid ? (
                    <span className="flex items-center">
                      <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" />
                      受取済
                    </span>
                  ) : (
                    <span className="flex items-center text-slate-600">
                      <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />
                      未受取
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
