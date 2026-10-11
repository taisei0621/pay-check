'use client';

import React from 'react';
import { PaymentEntity } from '@/types/database';
import { Check, Clock, Loader2, Sparkles } from 'lucide-react';

interface ParticipantListProps {
  payments: PaymentEntity[];
  onToggleStatus: (paymentId: string, currentStatus: boolean) => Promise<void>;
  loadingId: string | null;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  payments,
  onToggleStatus,
  loadingId,
}) => {
  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm text-slate-400">
        参加者が登録されていません
      </div>
    );
  }

  const paidCount = payments.filter((p) => p.is_paid).length;

  return (
    <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
      <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/60 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center space-x-2">
          <h3 className="font-bold text-slate-800 text-sm">参加者一覧</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100/70 text-blue-700">
            {paidCount} / {payments.length} 名完了
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          タップして支払いを切替
        </span>
      </div>

      <ul className="divide-y divide-slate-100">
        {payments.map((payment) => {
          const isLoading = loadingId === payment.id;

          return (
            <li
              key={payment.id}
              className={`flex items-center justify-between p-4 sm:px-6 transition-all duration-200 ${
                payment.is_paid
                  ? 'bg-emerald-50/25 hover:bg-emerald-50/40'
                  : 'hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center space-x-3.5 min-w-0 mr-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors shadow-xs ${
                    payment.is_paid
                      ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-500/20'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {payment.participant_name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-base truncate">
                    {payment.participant_name}
                  </p>
                  <p className="text-xs text-slate-400 font-medium flex items-center">
                    {payment.is_paid ? (
                      <span className="text-emerald-600 font-semibold flex items-center">
                        <Sparkles className="w-3 h-3 mr-1 inline" />
                        受取済み
                      </span>
                    ) : (
                      <span>未受取</span>
                    )}
                  </p>
                </div>
              </div>

              {/* 1タップ切り替えトグルボタン */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => onToggleStatus(payment.id, payment.is_paid)}
                className={`relative inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 shadow-sm min-w-[105px] shrink-0 cursor-pointer ${
                  isLoading
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : payment.is_paid
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
                aria-label={`${payment.participant_name}の支払い状態を切り替える`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : payment.is_paid ? (
                  <span className="flex items-center">
                    <Check className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                    受取済
                  </span>
                ) : (
                  <span className="flex items-center text-slate-600">
                    <Clock className="w-4 h-4 mr-1.5 text-amber-500" />
                    未払い
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
