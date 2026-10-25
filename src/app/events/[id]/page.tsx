'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { EventWithPayments, RoundingOptions } from '@/types/database';
import { getEventWithPayments, togglePaymentStatus } from '@/services/eventService';
import { calculateSettlement, generateShareMessage } from '@/lib/utils/payment-calc';
import { SummaryCard } from '@/components/SummaryCard';
import { ParticipantList } from '@/components/ParticipantList';
import { PaymentActionCard } from '@/components/PaymentActionCard';
import { RoundSettingSelector } from '@/components/RoundSettingSelector';
import { CompletionCelebration } from '@/components/CompletionCelebration';
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Loader2,
  Share2,
} from 'lucide-react';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: EventPageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [eventData, setEventData] = useState<EventWithPayments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [roundingOptions, setRoundingOptions] = useState<RoundingOptions>({
    unit: 1,
    method: 'round',
  });

  // データ取得関数
  const fetchEvent = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getEventWithPayments(eventId);
    if (result.error || !result.data) {
      setError(result.error || 'イベントが見つかりませんでした');
    } else {
      setEventData(result.data);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // 支払いステータス切り替えハンドラ
  const handleToggleStatus = async (paymentId: string, currentStatus: boolean) => {
    if (!eventData) return;

    setTogglingId(paymentId);
    const newStatus = !currentStatus;

    // 楽観的UI更新
    const previousPayments = [...eventData.payments];
    const updatedPayments = eventData.payments.map((p) =>
      p.id === paymentId
        ? {
            ...p,
            is_paid: newStatus,
            paid_at: newStatus ? new Date().toISOString() : null,
          }
        : p
    );
    setEventData({ ...eventData, payments: updatedPayments });

    // DB永続化
    const result = await togglePaymentStatus(paymentId, newStatus);

    if (!result.success) {
      setEventData({ ...eventData, payments: previousPayments });
      alert(result.error || '更新に失敗しました');
    }

    setTogglingId(null);
  };

  // URL共有コピー
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      prompt('以下のURLをコピーしてください:', window.location.href);
    }
  };

  // LINE・SNS用案内文の自動生成＆コピー
  const handleCopyShareMessage = async () => {
    if (!eventData) return;

    const message = generateShareMessage({
      title: eventData.title,
      total_amount: eventData.total_amount,
      amount_per_person: eventData.amount_per_person,
      payer_name: eventData.payer_name,
      payment_destination: eventData.payment_destination,
      eventUrl: window.location.href,
    });

    try {
      await navigator.clipboard.writeText(message);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } catch {
      prompt('以下の案内文をコピーして共有してください:', message);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-600 text-sm font-semibold">読み込み中...</p>
        </div>
      </main>
    );
  }

  if (error || !eventData) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg border border-slate-100 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">エラーが発生しました</h2>
          <p className="text-slate-600 text-sm mb-6">{error || '指定されたイベントは存在しません'}</p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={fetchEvent}
              className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              再試行
            </button>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
            >
              トップへ戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 精算サマリー計算（端数丸め設定を反映）
  const settlement = calculateSettlement(eventData, eventData.payments, roundingOptions);
  const isAllPaid = settlement.collectTargetCount > 0 && settlement.remainingAmount === 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* ナビゲーションバー */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            トップへ
          </Link>

          <div className="flex items-center space-x-2">
            {/* LINE案内文コピー */}
            <button
              onClick={handleCopyShareMessage}
              className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            >
              {copiedMessage ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" />
                  <span>案内文コピー済</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 mr-1" />
                  <span>案内文コピー</span>
                </>
              )}
            </button>

            {/* URLコピー */}
            <button
              onClick={handleCopyUrl}
              className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-blue-600 stroke-[3]" />
                  <span className="text-blue-600">URLコピー済</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  <span>URLコピー</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* イベント名 */}
        <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 mb-5">
          <h1 className="text-2xl font-black text-slate-900 break-words tracking-tight">
            {eventData.title}
          </h1>
        </div>

        {/* 全員回収完了時の祝賀演出 */}
        {isAllPaid && (
          <CompletionCelebration
            payerName={settlement.payerName}
            totalAmount={settlement.totalAmount}
          />
        )}

        {/* 送金アクションカード */}
        <PaymentActionCard
          destination={eventData.payment_destination}
          payerName={eventData.payer_name}
        />

        {/* 端数丸めセレクター */}
        <RoundSettingSelector
          currentOptions={roundingOptions}
          onChange={setRoundingOptions}
        />

        {/* 精算状況サマリー */}
        <SummaryCard settlement={settlement} />

        {/* 送金指示・参加者一覧 */}
        <ParticipantList
          payments={eventData.payments}
          transfers={settlement.transfers}
          payerName={settlement.payerName}
          baseAmount={settlement.perPersonAmount}
          onToggleStatus={handleToggleStatus}
          loadingId={togglingId}
        />
      </div>
    </main>
  );
}
