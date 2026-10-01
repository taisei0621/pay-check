import React from 'react';
import { PaymentSummary } from '@/types/database';
import { CheckCircle2, Clock, Users, JapaneseYen } from 'lucide-react';

interface SummaryCardProps {
  summary: PaymentSummary;
  amountPerPerson: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  summary,
  amountPerPerson,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            1人あたりの金額
          </span>
          <p className="text-2xl font-bold text-gray-900">
            {amountPerPerson.toLocaleString()}
            <span className="text-sm font-normal text-gray-600 ml-1">円</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            集金進捗
          </span>
          <p className="text-2xl font-bold text-blue-600">
            {summary.progressPercentage}%
          </p>
        </div>
      </div>

      {/* プログレスバー */}
      <div className="w-full bg-gray-100 rounded-full h-3 mb-6 overflow-hidden">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${summary.progressPercentage}%` }}
        />
      </div>

      {/* サマリーカードグリッド */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center text-xs text-gray-500 mb-1">
            <Users className="w-3.5 h-3.5 mr-1" />
            参加人数
          </div>
          <p className="text-lg font-bold text-gray-900">
            {summary.totalParticipants}名
          </p>
        </div>

        <div className="bg-emerald-50 rounded-xl p-3">
          <div className="flex items-center text-xs text-emerald-700 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            支払済
          </div>
          <p className="text-lg font-bold text-emerald-700">
            {summary.paidCount}名
          </p>
        </div>

        <div className="bg-amber-50 rounded-xl p-3">
          <div className="flex items-center text-xs text-amber-700 mb-1">
            <Clock className="w-3.5 h-3.5 mr-1" />
            未払い
          </div>
          <p className="text-lg font-bold text-amber-700">
            {summary.unpaidCount}名
          </p>
        </div>

        <div className="bg-blue-50 rounded-xl p-3">
          <div className="flex items-center text-xs text-blue-700 mb-1">
            <JapaneseYen className="w-3.5 h-3.5 mr-1" />
            未回収金額
          </div>
          <p className="text-lg font-bold text-blue-700">
            {summary.remainingAmount.toLocaleString()}円
          </p>
        </div>
      </div>
    </div>
  );
};
