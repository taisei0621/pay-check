import React from 'react';
import { UserCheck, Wallet, ArrowRight } from 'lucide-react';

interface PayerInfoCardProps {
  payerName?: string | null;
  paymentDestination?: string | null;
}

export const PayerInfoCard: React.FC<PayerInfoCardProps> = ({
  payerName,
  paymentDestination,
}) => {
  // どちらも未設定の場合は表示しない
  if (!payerName && !paymentDestination) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl p-5 border border-blue-100 shadow-sm mb-6">
      <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">
        <Wallet className="w-4 h-4" />
        <span>集金・送金のご案内</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {payerName && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3.5 border border-blue-50/80 shadow-xs">
            <span className="text-xs text-gray-500 font-medium flex items-center mb-1">
              <UserCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
              立替者（支払いをした人）
            </span>
            <p className="text-base font-bold text-gray-900">
              {payerName} <span className="text-xs font-normal text-gray-500">さん</span>
            </p>
          </div>
        )}

        {paymentDestination && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3.5 border border-blue-50/80 shadow-xs">
            <span className="text-xs text-gray-500 font-medium flex items-center mb-1">
              <ArrowRight className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              集金先・送金方法
            </span>
            <p className="text-base font-bold text-gray-900 break-words">
              {paymentDestination}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
