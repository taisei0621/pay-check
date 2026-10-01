'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateEventInput } from '@/lib/utils/payment-calc';
import { createEventWithParticipants } from '@/services/eventService';
import { Loader2, PlusCircle, Users, JapaneseYen, Calendar } from 'lucide-react';

export const EventCreateForm: React.FC = () => {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('3000');
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
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">集金イベントを作成</h2>
        <p className="text-sm text-gray-500 mt-1">イベント名と参加者を登録してURLを発行します</p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      {/* イベント名 */}
      <div className="mb-5">
        <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
          <Calendar className="w-4 h-4 mr-1.5 text-gray-500" />
          イベント名
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 送別会、フットサル代"
          className={`w-full px-4 py-3 rounded-xl border ${
            errors.title ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
          } focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-gray-900`}
        />
        {errors.title && (
          <p className="text-xs text-red-600 mt-1.5">{errors.title}</p>
        )}
      </div>

      {/* 1人あたりの金額 */}
      <div className="mb-5">
        <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
          <JapaneseYen className="w-4 h-4 mr-1.5 text-gray-500" />
          1人あたりの金額 (円)
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="3000"
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.amount ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
            } focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-gray-900`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">円</span>
        </div>
        {errors.amount && (
          <p className="text-xs text-red-600 mt-1.5">{errors.amount}</p>
        )}
      </div>

      {/* 参加者名 */}
      <div className="mb-6">
        <label className="flex items-center text-sm font-semibold text-gray-700 mb-1">
          <Users className="w-4 h-4 mr-1.5 text-gray-500" />
          参加者リスト（改行区切り）
        </label>
        <p className="text-xs text-gray-500 mb-2">LINEなどのメンバー名をコピー＆ペーストできます</p>
        <textarea
          rows={5}
          value={participantsText}
          onChange={(e) => setParticipantsText(e.target.value)}
          placeholder={`田中太郎\n佐藤次郎\n鈴木三郎`}
          className={`w-full px-4 py-3 rounded-xl border ${
            errors.participants ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
          } focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-gray-900 font-mono text-sm leading-relaxed`}
        />
        {errors.participants && (
          <p className="text-xs text-red-600 mt-1.5">{errors.participants}</p>
        )}
      </div>

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 disabled:bg-blue-300"
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
