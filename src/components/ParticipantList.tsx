'use client';

import React from 'react';
import { PaymentEntity } from '@/types/database';
import { Check, Clock, Loader2 } from 'lucide-react';

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
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-gray-500">
        参加者が登録されていません
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 text-sm">参加者一覧</h3>
        <span className="text-xs text-gray-500">ボタンをタップして状態を切替</span>
      </div>

      <ul className="divide-y divide-gray-100">
        {payments.map((payment) => {
          const isLoading = loadingId === payment.id;

          return (
            <li
              key={payment.id}
              className={`flex items-center justify-between p-4 px-6 transition-colors ${
                payment.is_paid ? 'bg-emerald-50/30' : 'hover:bg-gray-50/80'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    payment.is_paid
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {payment.participant_name.slice(0, 1)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-base">
                    {payment.participant_name}
                  </p>
                  {payment.is_paid && payment.paid_at && (
                    <p className="text-xs text-emerald-600">
                      支払済
                    </p>
                  )}
                </div>
              </div>

              {/* 1タップ切り替えトグルボタン */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => onToggleStatus(payment.id, payment.is_paid)}
                className={`relative inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 shadow-sm min-w-[110px] ${
                  isLoading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : payment.is_paid
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
                aria-label={`${payment.participant_name}の支払い状態を切り替える`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : payment.is_paid ? (
                  <span className="flex items-center">
                    <Check className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                    支払済
                  </span>
                ) : (
                  <span className="flex items-center text-gray-600">
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
