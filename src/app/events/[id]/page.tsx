'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import {
  EventWithPayments,
  RoundingOptions,
  ExpenseEntity,
  EventPhotoEntity,
} from '@/types/database';
import { getEventWithPayments, togglePaymentStatus } from '@/services/eventService';
import { calculateSettlement, generateShareMessage } from '@/lib/utils/payment-calc';
import { SummaryCard } from '@/components/SummaryCard';
import { ParticipantList } from '@/components/ParticipantList';
import { PaymentActionCard } from '@/components/PaymentActionCard';
import { RoundSettingSelector } from '@/components/RoundSettingSelector';
import { CompletionCelebration } from '@/components/CompletionCelebration';
import { ExpenseManager } from '@/components/ExpenseManager';
import { PhotoAlbum } from '@/components/PhotoAlbum';
import { SlideshowModal } from '@/components/SlideshowModal';
import { ReceiptModal } from '@/components/ReceiptModal';
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Loader2,
  Share2,
  ListOrdered,
  Plane,
  Camera,
} from 'lucide-react';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

type TabType = 'standard' | 'expenses' | 'photos';

export default function EventDetailPage({ params }: EventPageProps) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [eventData, setEventData] = useState<EventWithPayments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('standard');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
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

  // 支出リスト変更ハンドラ
  const handleExpensesChange = (newExpenses: ExpenseEntity[]) => {
    if (!eventData) return;
    setEventData({ ...eventData, expenses: newExpenses });
  };

  // 写真リスト変更ハンドラ
  const handlePhotosChange = (newPhotos: EventPhotoEntity[]) => {
    if (!eventData) return;
    setEventData({ ...eventData, photos: newPhotos });
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
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            イベントを読み込めませんでした
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            {error || '指定されたイベントは存在しません'}
          </p>
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

  // 精算サマリー計算
  const settlement = calculateSettlement(eventData, eventData.payments, roundingOptions);
  const isAllPaid = settlement.collectTargetCount > 0 && settlement.remainingAmount === 0;
  const participantNames = eventData.payments.map((p) => p.participant_name);
  const photos = eventData.photos || [];
  const expenses = eventData.expenses || [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* ナビゲーションバー */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition"
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

        {/* イベント名カード */}
        <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 mb-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            イベント名
          </span>
          <h1 className="text-2xl font-black text-slate-900 break-words tracking-tight">
            {eventData.title}
          </h1>
        </div>

        {/* 全員回収完了時の祝賀演出 */}
        {isAllPaid && (
          <CompletionCelebration
            payerName={settlement.payerName}
            totalAmount={settlement.totalAmount}
            onOpenSlideshow={() => setIsSlideshowOpen(true)}
            hasPhotos={photos.length > 0}
          />
        )}

        {/* 送金アクションカード */}
        <PaymentActionCard
          destination={eventData.payment_destination}
          payerName={eventData.payer_name}
        />

        {/* タブナビゲーション */}
        <div className="flex items-center gap-1.5 mb-5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70">
          <button
            type="button"
            onClick={() => setActiveTab('standard')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'standard'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>通常精算</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plane className="w-3.5 h-3.5 text-blue-600" />
            <span>旅行相殺</span>
            {expenses.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold">
                {expenses.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-amber-500" />
            <span>思い出アルバム</span>
            {photos.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                {photos.length}
              </span>
            )}
          </button>
        </div>

        {/* タブ1: 通常精算 */}
        {activeTab === 'standard' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 端数丸めセレクター */}
            <RoundSettingSelector
              currentOptions={roundingOptions}
              onChange={setRoundingOptions}
            />

            {/* 精算状況サマリー */}
            <SummaryCard
              settlement={settlement}
              receiptImage={eventData.receipt_image}
              onOpenReceipt={() => setIsReceiptModalOpen(true)}
            />

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
        )}

        {/* タブ2: 複数立替・旅行相殺モード */}
        {activeTab === 'expenses' && (
          <div className="animate-in fade-in duration-200">
            <ExpenseManager
              eventId={eventData.id}
              participantNames={participantNames}
              expenses={expenses}
              onExpensesChange={handleExpensesChange}
            />
          </div>
        )}

        {/* タブ3: 思い出写真アルバム */}
        {activeTab === 'photos' && (
          <div className="animate-in fade-in duration-200">
            <PhotoAlbum
              eventId={eventData.id}
              photos={photos}
              isUnlocked={isAllPaid}
              progressPercentage={settlement.progressPercentage}
              onPhotosChange={handlePhotosChange}
              eventTitle={eventData.title}
            />
          </div>
        )}
      </div>

      {/* レシート全画面モーダル */}
      {eventData.receipt_image && (
        <ReceiptModal
          imageUrl={eventData.receipt_image}
          title={`${eventData.title} のレシート明細`}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}

      {/* スライドショーモーダル */}
      <SlideshowModal
        photos={photos}
        isOpen={isSlideshowOpen}
        onClose={() => setIsSlideshowOpen(false)}
        eventTitle={eventData.title}
      />
    </main>
  );
}
