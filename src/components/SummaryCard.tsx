import React from 'react';
import { SettlementSummary, PaymentSummary } from '@/types/database';
import { CheckCircle2, Clock, Users, JapaneseYen, Trophy, UserCheck } from 'lucide-react';

interface SummaryCardProps {
  settlement?: SettlementSummary;
  // 後方互換用
  summary?: PaymentSummary;
  amountPerPerson?: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  settlement,
  summary,
  amountPerPerson = 0,
}) => {
  const payerName = settlement?.payerName || null;
  const totalAmount = settlement?.totalAmount ?? ((summary?.totalParticipants || 0) * amountPerPerson);
  const perPerson = settlement?.perPersonAmount ?? amountPerPerson;
  const remainingAmount = settlement?.remainingAmount ?? (summary?.remainingAmount || 0);
  const collectedAmount = settlement?.collectedAmount ?? (summary?.totalCollectedAmount || 0);
  const targetAmount = settlement?.collectTargetAmount ?? (summary?.totalParticipants || 0) * amountPerPerson;
  const paidCount = settlement?.paidCount ?? (summary?.paidCount || 0);
  const totalCount = settlement?.collectTargetCount ?? (summary?.totalParticipants || 0);
  const progressPercentage = settlement?.progressPercentage ?? (summary?.progressPercentage || 0);

  const isAllPaid = totalCount > 0 && remainingAmount === 0;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-lg shadow-slate-200/50 border border-slate-100 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          {payerName ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 mb-1">
              <UserCheck className="w-4 h-4" />
              <span>立替者: {payerName}</span>
            </div>
          ) : (
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              精算状況
            </span>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {totalAmount.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-slate-500">円立替</span>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end space-x-1 mb-0.5">
            {isAllPaid && <Trophy className="w-4 h-4 text-amber-500" />}
            <span className="text-xs font-bold text-slate-400">
              {isAllPaid ? '回収完了' : '回収進捗'}
            </span>
          </div>
          <p
            className={`text-3xl font-black tracking-tight ${
              isAllPaid ? 'text-emerald-600' : 'text-blue-600'
            }`}
          >
            {progressPercentage}%
          </p>
        </div>
      </div>

      {/* プログレスバー */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-5 overflow-hidden p-0.5 border border-slate-200/60">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isAllPaid
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* サマリー数値 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
          <span className="text-xs text-slate-400 font-medium block mb-0.5">1人あたり</span>
          <p className="text-lg font-bold text-slate-900">
            ¥{perPerson.toLocaleString()}
          </p>
        </div>

        <div className="bg-blue-50/70 rounded-2xl p-3 border border-blue-100">
          <span className="text-xs text-blue-600 font-medium block mb-0.5">未回収額</span>
          <p className="text-lg font-bold text-blue-700">
            残り ¥{remainingAmount.toLocaleString()}
          </p>
        </div>

        <div className="bg-emerald-50/70 rounded-2xl p-3 border border-emerald-100">
          <span className="text-xs text-emerald-600 font-medium block mb-0.5">回収済</span>
          <p className="text-lg font-bold text-emerald-700">
            {paidCount} / {totalCount} 名
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
          <span className="text-xs text-slate-400 font-medium block mb-0.5">回収対象額</span>
          <p className="text-lg font-bold text-slate-700">
            ¥{targetAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 端数丸め差額の案内 */}
      {settlement?.payerDiff !== undefined && settlement.payerDiff !== 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">端数丸めによる差額</span>
          <span
            className={`font-bold ${
              settlement.payerDiff > 0 ? 'text-blue-600' : 'text-amber-600'
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
