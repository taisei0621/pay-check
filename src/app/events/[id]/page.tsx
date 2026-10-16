'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { EventWithPayments } from '@/types/database';
import { getEventWithPayments, togglePaymentStatus } from '@/services/eventService';
import { calculatePaymentSummary, generateShareMessage } from '@/lib/utils/payment-calc';
import { SummaryCard } from '@/components/SummaryCard';
import { ParticipantList } from '@/components/ParticipantList';
import { PayerInfoCard } from '@/components/PayerInfoCard';
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Loader2,
  Calendar,
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

  // 支払いステータス切り替えハンドラ (全層貫通機能)
  const handleToggleStatus = async (paymentId: string, currentStatus: boolean) => {
    if (!eventData) return;

    setTogglingId(paymentId);
    const newStatus = !currentStatus;

    // 1. 楽観的UI更新 (即座にUIを反転)
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

    // 2. DB (Supabase) 永続化
    const result = await togglePaymentStatus(paymentId, newStatus);

    if (!result.success) {
      // 失敗時はロールバック
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
          <p className="text-slate-600 text-sm font-semibold">集金データを読み込み中...</p>
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

  // 集計サマリーの計算（純粋関数）
  const summary = calculatePaymentSummary(eventData.amount_per_person, eventData.payments);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* ナビゲーションバー */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            新規イベント作成
          </Link>

          <div className="flex items-center space-x-2">
            {/* LINE案内文コピーボタン */}
            <button
              onClick={handleCopyShareMessage}
              className="inline-flex items-center px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
              title="LINEやチャットで使える集金案内テキストをコピー"
            >
              {copiedMessage ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
                  <span>案内文コピー完了</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>LINE案内文コピー</span>
                </>
              )}
            </button>

            {/* URLコピーボタン */}
            <button
              onClick={handleCopyUrl}
              className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-blue-600 stroke-[2.5]" />
                  <span className="text-blue-600">URLコピー完了</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  <span>URLコピー</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* イベントタイトルヘッダー */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-lg shadow-slate-200/50 border border-slate-100 mb-6">
          <div className="flex items-center text-xs font-bold text-blue-600 uppercase tracking-wider mb-1.5">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            集金イベント
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 break-words tracking-tight">
            {eventData.title}
          </h1>
        </div>

        {/* 立替者・集金先案内カード（新規） */}
        <PayerInfoCard
          payerName={eventData.payer_name}
          paymentDestination={eventData.payment_destination}
        />

        {/* 集金進捗サマリーカード */}
        <SummaryCard
          summary={summary}
          amountPerPerson={eventData.amount_per_person}
        />

        {/* 参加者一覧 & 未払い/支払済トグル (全層貫通機能) */}
        <ParticipantList
          payments={eventData.payments}
          onToggleStatus={handleToggleStatus}
          loadingId={togglingId}
          baseAmount={eventData.amount_per_person}
        />

        {/* フッターヒント */}
        <div className="mt-8 text-center text-xs text-slate-400 space-y-1">
          <p>「LINE案内文コピー」で参加者全員に振込先とURLを一括共有できます。</p>
          <p>このページをブックマークしておけば、いつでも受取状況を更新できます。</p>
        </div>
      </div>
    </main>
  );
}
