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
  Calendar,
  UserCheck,
  CreditCard,
  Camera,
  Check,
  ArrowRight,
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

    // 送金先が指定されている場合はブラウザに記憶
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
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto shadow-sm text-zinc-100"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
          新しい精算イベントを作成
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          イベント情報と参加者を入力して精算ページを発行します。
        </p>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* イベント名 */}
      <div className="mb-5">
        <label className="flex items-center text-xs font-semibold text-zinc-300 mb-1.5">
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
          イベント名 <span className="text-red-400 ml-1">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 送別会、キャンプ代、温泉旅行"
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-none ${
            errors.title
              ? 'border-red-500 focus:border-red-400'
              : 'border-zinc-800 focus:border-zinc-500'
          }`}
        />
        {errors.title && (
          <p className="text-xs text-red-400 mt-1">{errors.title}</p>
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

      {/* 立替総額 */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <label className="flex items-center text-xs font-semibold text-zinc-300">
            立替総額 <span className="text-red-400 ml-1">*</span>
          </label>
          {participantCount > 0 && validTotalAmount > 0 && (
            <span className="text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
              1人あたり ¥{estimatedPerPerson.toLocaleString()} : {participantCount}名
            </span>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
            ¥
          </span>
          <input
            type="number"
            min="0"
            step="100"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="12000"
            className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm transition bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-none ${
              errors.amount
                ? 'border-red-500 focus:border-red-400'
                : 'border-zinc-800 focus:border-zinc-500'
            }`}
          />
        </div>
        {errors.amount && (
          <p className="text-xs text-red-400 mt-1">{errors.amount}</p>
        )}
      </div>

      {/* 立替者名 */}
      <div className="mb-5">
        <label className="flex items-center text-xs font-semibold text-zinc-300 mb-1.5">
          <UserCheck className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
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
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-white text-zinc-950'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 mr-1 stroke-[3]" />}
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
          placeholder="立替者名（参加者タグから選択または直接入力）"
          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-500 transition"
        />
      </div>

      {/* 集金先・送金先情報 & よく使う送金先 */}
      <div className="mb-5">
        <label className="flex items-center text-xs font-semibold text-zinc-300 mb-1.5">
          <CreditCard className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
          送金先・受取先情報
        </label>
        <input
          type="text"
          value={paymentDestination}
          onChange={(e) => setPaymentDestination(e.target.value)}
          placeholder="例: PayPayリンク、PayPay ID、三井住友銀行普通口座"
          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-500 transition"
        />
        <SavedDestinationChips onSelect={(dest) => setPaymentDestination(dest)} />
      </div>

      {/* レシート写真の添付 */}
      <div className="mb-6">
        <label className="flex items-center text-xs font-semibold text-zinc-300 mb-1.5">
          <Receipt className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
          レシート写真の添付
        </label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer transition">
            <Camera className="w-4 h-4 text-zinc-400" />
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
                className="w-10 h-10 object-cover rounded-lg border border-zinc-700"
              />
              <button
                type="button"
                onClick={() => setReceiptImage(null)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full flex items-center justify-center text-[10px] cursor-pointer"
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
        className="w-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs text-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>発行処理中...</span>
          </>
        ) : (
          <>
            <span>精算URLを発行する</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};
