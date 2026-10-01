'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { EventWithPayments, PaymentEntity } from '@/types/database';
import { getEventWithPayments, togglePaymentStatus } from '@/services/eventService';
import { calculatePaymentSummary } from '@/lib/utils/payment-calc';
import { SummaryCard } from '@/components/SummaryCard';
import { ParticipantList } from '@/components/ParticipantList';
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Loader2,
  Calendar,
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
  const [copied, setCopied] = useState(false);

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // フォールバック
      prompt('以下のURLをコピーしてください:', window.location.href);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600 text-sm font-medium">イベント情報を読み込み中...</p>
        </div>
      </main>
    );
  }

  if (error || !eventData) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-sm border border-gray-100 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 text-sm mb-6">{error || '指定されたイベントは存在しません'}</p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={fetchEvent}
              className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              再試行
            </button>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition"
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
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー操作ナビゲーション */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            新規イベント作成
          </Link>

          <button
            onClick={handleCopyUrl}
            className="inline-flex items-center px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl shadow-sm transition active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                <span className="text-emerald-600">URLコピー完了</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                共有URLをコピー
              </>
            )}
          </button>
        </div>

        {/* イベントタイトルヘッダー */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            集金イベント
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
            {eventData.title}
          </h1>
        </div>

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
        />

        <div className="mt-8 text-center text-xs text-gray-400">
          このページをブックマークすると、いつでも集金状況の確認・更新ができます。
        </div>
      </div>
    </main>
  );
}
