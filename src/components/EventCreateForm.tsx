'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateEventInput } from '@/lib/utils/payment-calc';
import { createEventWithParticipants } from '@/services/eventService';
import {
  ParticipantTagInput,
  ParticipantItem,
} from '@/components/ParticipantTagInput';
import { SavedDestinationChips } from '@/components/SavedDestinationChips';
import { saveDestination } from '@/lib/utils/saved-destinations';
import { compressImage } from '@/lib/utils/image-compress';
import {
  Loader2,
  PlusCircle,
  JapaneseYen,
  Calendar,
  UserCheck,
  CreditCard,
  Camera,
  Check,
  Receipt,
} from 'lucide-react';

export const EventCreateForm: React.FC = () => {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState<string>('12000');
  const [payerName, setPayerName] = useState('');
  const [paymentDestination, setPaymentDestination] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parsedTotal = parseInt(totalAmount, 10);
  const validTotalAmount = !isNaN(parsedTotal) && parsedTotal >= 0 ? parsedTotal : 0;
  const participantCount = participants.length;

  // 1人あたりの目安金額
  const estimatedPerPerson =
    participantCount > 0 ? Math.round(validTotalAmount / participantCount) : validTotalAmount;

  // レシート画像選択
  const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressed = await compressImage(file, 1200, 0.8);
      setReceiptImage(compressed);
    } catch {
      setErrorMessage('画像の読み込みに失敗しました');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const participantItems = participants.map((p) => ({
      name: p.name.trim(),
      custom_amount: p.custom_amount ?? null,
    }));

    // バリデーション実行
    const validation = validateEventInput({
      title,
      total_amount: validTotalAmount,
      amount_per_person: estimatedPerPerson,
      participant_items: participantItems,
      payer_name: payerName,
      payment_destination: paymentDestination,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    if (paymentDestination.trim()) {
      saveDestination(paymentDestination.trim());
    }

    const result = await createEventWithParticipants({
      title,
      total_amount: validTotalAmount,
      amount_per_person: estimatedPerPerson,
      participant_items: participantItems,
      payer_name: payerName,
      payment_destination: paymentDestination,
      receipt_image: receiptImage,
    });

    if (!result.success || !result.eventId) {
      setErrorMessage(result.error || 'イベントの作成に失敗しました');
      setIsSubmitting(false);
      return;
    }

    router.push(`/events/${result.eventId}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 max-w-lg mx-auto"
    >
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          イベント作成
        </h2>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
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
          placeholder="例: 送別会、フットサル代、温泉旅行"
          className={`w-full px-4 py-3 rounded-xl border text-sm ${
            errors.title ? 'border-red-500 bg-red-50/20' : 'border-slate-200 bg-slate-50/50'
          } focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-slate-900`}
        />
        {errors.title && (
          <p className="text-xs text-red-600 mt-1 font-medium">{errors.title}</p>
        )}
      </div>

      {/* 参加者タグ入力 */}
      <div className="mb-5">
        <ParticipantTagInput
          participants={participants}
          onChange={setParticipants}
          baseAmount={estimatedPerPerson}
          error={errors.participants}
        />
      </div>

      {/* 誰が立て替えたか */}
      <div className="mb-5">
        <label className="flex items-center text-sm font-bold text-slate-700 mb-1.5">
          <UserCheck className="w-4 h-4 mr-1.5 text-indigo-600" />
          誰が立て替えたか
        </label>

        {participants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {participants.map((p) => {
              const isSelected = payerName === p.name;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPayerName(isSelected ? '' : p.name)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" />}
                  {p.name}
                </button>
              );
            })}
          </div>
        )}

        <input
          type="text"
          value={payerName}
          onChange={(e) => setPayerName(e.target.value)}
          placeholder="立替者名（参加者タグを選択または入力）"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-slate-900"
        />
      </div>

      {/* 立替総額 */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <label className="flex items-center text-sm font-bold text-slate-700">
            <JapaneseYen className="w-4 h-4 mr-1.5 text-blue-600" />
            立替総額 <span className="text-red-500 ml-1 text-xs">*</span>
          </label>
          {participantCount > 0 && validTotalAmount > 0 && (
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              1人あたり ¥{estimatedPerPerson.toLocaleString()}（{participantCount}名）
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="100"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="12000"
            className={`w-full px-4 py-3 rounded-xl border text-sm ${
              errors.amount ? 'border-red-500 bg-red-50/20' : 'border-slate-200 bg-slate-50/50'
            } focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-slate-900`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
            円
          </span>
        </div>
        {errors.amount && (
          <p className="text-xs text-red-600 mt-1 font-medium">{errors.amount}</p>
        )}
      </div>

      {/* 送金先・集金先 */}
      <div className="mb-5">
        <label className="flex items-center text-sm font-bold text-slate-700 mb-1.5">
          <CreditCard className="w-4 h-4 mr-1.5 text-indigo-600" />
          集金先
        </label>
        <input
          type="text"
          value={paymentDestination}
          onChange={(e) => setPaymentDestination(e.target.value)}
          placeholder="例: PayPayリンク、PayPay ID、銀行口座"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-slate-900"
        />
        <SavedDestinationChips onSelect={(dest) => setPaymentDestination(dest)} />
      </div>

      {/* レシート写真の添付 */}
      <div className="mb-6">
        <label className="flex items-center text-sm font-bold text-slate-700 mb-1.5">
          <Receipt className="w-4 h-4 mr-1.5 text-blue-600" />
          レシート写真の添付
        </label>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition">
            <Camera className="w-4 h-4 text-slate-500" />
            <span>{isCompressing ? '圧縮処理中...' : 'レシートを選択'}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleReceiptChange}
              className="hidden"
              disabled={isCompressing}
            />
          </label>

          {receiptImage && (
            <div className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receiptImage}
                alt="レシート"
                className="w-11 h-11 object-cover rounded-xl border border-slate-300 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setReceiptImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-800 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs cursor-pointer shadow-xs"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 発行ボタン */}
      <button
        type="submit"
        disabled={isSubmitting || isCompressing}
        className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-2xl transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>作成中...</span>
          </>
        ) : (
          <>
            <PlusCircle className="w-5 h-5" />
            <span>集金URLを発行する</span>
          </>
        )}
      </button>
    </form>
  );
};
