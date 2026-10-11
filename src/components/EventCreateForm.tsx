'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateEventInput } from '@/lib/utils/payment-calc';
import { createEventWithParticipants } from '@/services/eventService';
import {
  Loader2,
  PlusCircle,
  Users,
  JapaneseYen,
  Calendar,
  UserCheck,
  CreditCard,
  Sparkles,
} from 'lucide-react';

export const EventCreateForm: React.FC = () => {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('3000');
  const [payerName, setPayerName] = useState('');
  const [paymentDestination, setPaymentDestination] = useState('');
  const [participantsText, setParticipantsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 改行区切りで参加者名をパース
    const participantNames = participantsText
      .split('\n')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    const parsedAmount = parseInt(amount, 10);

    // バリデーション実行
    const validation = validateEventInput({
      title,
      amount_per_person: isNaN(parsedAmount) ? -1 : parsedAmount,
      participant_names: participantNames,
      payer_name: payerName,
      payment_destination: paymentDestination,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const result = await createEventWithParticipants({
      title,
      amount_per_person: parsedAmount,
      participant_names: participantNames,
      payer_name: payerName,
      payment_destination: paymentDestination,
    });

    if (!result.success || !result.eventId) {
      setErrorMessage(result.error || 'イベントの作成に失敗しました。設定を確認してください。');
      setIsSubmitting(false);
      return;
    }

    // 作成成功時、イベント管理ページへリダイレクト
    router.push(`/events/${result.eventId}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 max-w-lg mx-auto transition-all"
    >
      <div className="text-center mb-7">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 mb-2 border border-blue-100">
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          簡単1分で集金URL発行
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          集金イベントを作成
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          イベント情報と参加者を登録すると専用URLを発行します
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      {/* イベント名 */}
      <div className="mb-5">
        <label className="flex items-center text-sm font-bold text-slate-700 mb-1.5">
          <Calendar className="w-4 h-4 mr-1.5 text-blue-600" />
          イベント名 <span className="text-red-500 ml-1 text-xs">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 送別会、フットサルコート代"
          className={`w-full px-4 py-3 rounded-xl border text-sm ${
            errors.title ? 'border-red-500 bg-red-50/20' : 'border-slate-200 bg-slate-50/50'
          } focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-slate-900`}
        />
        {errors.title && (
          <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.title}</p>
        )}
      </div>

      {/* 1人あたりの金額 */}
      <div className="mb-5">
        <label className="flex items-center text-sm font-bold text-slate-700 mb-1.5">
          <JapaneseYen className="w-4 h-4 mr-1.5 text-blue-600" />
          1人あたりの金額 <span className="text-red-500 ml-1 text-xs">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="3000"
            className={`w-full px-4 py-3 rounded-xl border text-sm ${
              errors.amount ? 'border-red-500 bg-red-50/20' : 'border-slate-200 bg-slate-50/50'
            } focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-slate-900`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
            円
          </span>
        </div>
        {errors.amount && (
          <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.amount}</p>
        )}
      </div>

      {/* 立替者・集金先設定グループ（新規拡張） */}
      <div className="mb-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
        <div>
          <label className="flex items-center text-xs font-bold text-slate-700 mb-1">
            <UserCheck className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            誰が立て替えたか（立替者名・任意）
          </label>
          <input
            type="text"
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            placeholder="例: 田中、幹事"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-3 focus:ring-blue-100 focus:outline-none transition-all text-slate-900"
          />
        </div>

        <div>
          <label className="flex items-center text-xs font-bold text-slate-700 mb-1">
            <CreditCard className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            誰にどう集めるか（集金先・支払い方法・任意）
          </label>
          <input
            type="text"
            value={paymentDestination}
            onChange={(e) => setPaymentDestination(e.target.value)}
            placeholder="例: 田中のPayPay、現金手渡し、三井住友銀行"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-3 focus:ring-blue-100 focus:outline-none transition-all text-slate-900"
          />
        </div>
      </div>

      {/* 参加者名 */}
      <div className="mb-6">
        <label className="flex items-center text-sm font-bold text-slate-700 mb-1">
          <Users className="w-4 h-4 mr-1.5 text-blue-600" />
          参加者リスト（改行区切り） <span className="text-red-500 ml-1 text-xs">*</span>
        </label>
        <p className="text-xs text-slate-400 mb-2">
          LINEなどのメンバー一覧をそのままコピー＆ペーストできます
        </p>
        <textarea
          rows={4}
          value={participantsText}
          onChange={(e) => setParticipantsText(e.target.value)}
          placeholder={`田中太郎\n佐藤次郎\n鈴木三郎`}
          className={`w-full px-4 py-3 rounded-xl border text-sm ${
            errors.participants ? 'border-red-500 bg-red-50/20' : 'border-slate-200 bg-slate-50/50'
          } focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-slate-900 font-mono leading-relaxed`}
        />
        {errors.participants && (
          <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.participants}</p>
        )}
      </div>

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>作成中...</span>
          </>
        ) : (
          <>
            <PlusCircle className="w-5 h-5" />
            <span>イベントを作成してURLを発行</span>
          </>
        )}
      </button>
    </form>
  );
};
