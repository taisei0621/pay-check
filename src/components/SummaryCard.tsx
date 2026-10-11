import React from 'react';
import { PaymentSummary } from '@/types/database';
import { CheckCircle2, Clock, Users, JapaneseYen, Trophy } from 'lucide-react';

interface SummaryCardProps {
  summary: PaymentSummary;
  amountPerPerson: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  summary,
  amountPerPerson,
}) => {
  const isAllPaid = summary.totalParticipants > 0 && summary.unpaidCount === 0;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-lg shadow-slate-200/50 border border-slate-100 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            1人あたりの金額
          </span>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {amountPerPerson.toLocaleString()}
            <span className="text-sm font-semibold text-slate-500 ml-1">円</span>
          </p>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end space-x-1.5 mb-0.5">
            {isAllPaid && <Trophy className="w-4 h-4 text-amber-500" />}
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isAllPaid ? '集金完了' : '集金進捗'}
            </span>
          </div>
          <p
            className={`text-3xl font-black tracking-tight ${
              isAllPaid ? 'text-emerald-600' : 'text-blue-600'
            }`}
          >
            {summary.progressPercentage}%
          </p>
        </div>
      </div>

      {/* プログレスバー */}
      <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden p-0.5 border border-slate-200/60">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isAllPaid
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600'
          }`}
          style={{ width: `${summary.progressPercentage}%` }}
        />
      </div>

      {/* サマリーカードグリッド */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
          <div className="flex items-center text-xs font-medium text-slate-500 mb-1">
            <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
            参加人数
          </div>
          <p className="text-xl font-bold text-slate-900">
            {summary.totalParticipants}
            <span className="text-xs font-normal text-slate-500 ml-0.5">名</span>
          </p>
        </div>

        <div className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-100">
          <div className="flex items-center text-xs font-medium text-emerald-700 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            支払済
          </div>
          <p className="text-xl font-bold text-emerald-700">
            {summary.paidCount}
            <span className="text-xs font-normal text-emerald-600 ml-0.5">名</span>
          </p>
        </div>

        <div className="bg-amber-50/70 rounded-2xl p-3.5 border border-amber-100">
          <div className="flex items-center text-xs font-medium text-amber-700 mb-1">
            <Clock className="w-3.5 h-3.5 mr-1" />
            未払い
          </div>
          <p className="text-xl font-bold text-amber-700">
            {summary.unpaidCount}
            <span className="text-xs font-normal text-amber-600 ml-0.5">名</span>
          </p>
        </div>

        <div className="bg-blue-50/70 rounded-2xl p-3.5 border border-blue-100">
          <div className="flex items-center text-xs font-medium text-blue-700 mb-1">
            <JapaneseYen className="w-3.5 h-3.5 mr-1" />
            未回収額
          </div>
          <p className="text-xl font-bold text-blue-700 truncate">
            {summary.remainingAmount.toLocaleString()}
            <span className="text-xs font-normal text-blue-600 ml-0.5">円</span>
          </p>
        </div>
      </div>
    </div>
  );
};
