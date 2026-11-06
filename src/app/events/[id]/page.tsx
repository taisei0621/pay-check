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
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-7 h-7 text-zinc-400 animate-spin" />
          <p className="text-zinc-400 text-xs font-mono">読み込み中...</p>
        </div>
      </main>
    );
  }

  if (error || !eventData) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full border border-zinc-800 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-zinc-100 mb-1">
            イベントを読み込めませんでした
          </h2>
          <p className="text-zinc-400 text-xs mb-6">
            {error || '指定されたイベントは存在しません'}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={fetchEvent}
              className="inline-flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              再試行
            </button>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold rounded-xl transition"
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
    <main className="min-h-screen bg-zinc-950 text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* ナビゲーションバー */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-medium text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            トップへ
          </Link>

          <div className="flex items-center gap-2">
            {/* LINE案内文コピー */}
            <button
              onClick={handleCopyShareMessage}
              className="inline-flex items-center px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium rounded-xl transition cursor-pointer"
              title="LINEやSNS用の案内文をコピー"
            >
              {copiedMessage ? (
                <>
                  <Check className="w-3 h-3 mr-1 text-emerald-400 stroke-[3]" />
                  <span className="text-emerald-400">案内文コピー済</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3 h-3 mr-1 text-zinc-400" />
                  <span>案内文コピー</span>
                </>
              )}
            </button>

            {/* URLコピー */}
            <button
              onClick={handleCopyUrl}
              className="inline-flex items-center px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-medium rounded-xl transition cursor-pointer"
              title="URLをコピー"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3 h-3 mr-1 text-emerald-400 stroke-[3]" />
                  <span className="text-emerald-400">URLコピー済</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1 text-zinc-400" />
                  <span>URLコピー</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* イベントヘッダーカード */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 mb-5 shadow-sm">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 block mb-1">
            イベント名
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 break-words tracking-tight">
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

        {/* 送金先アクションカード */}
        <PaymentActionCard
          destination={eventData.payment_destination}
          payerName={eventData.payer_name}
        />

        {/* タブナビゲーション */}
        <div className="flex items-center gap-1.5 mb-5 p-1 bg-zinc-900/80 border border-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('standard')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'standard'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>通常精算</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Plane className="w-3.5 h-3.5 text-emerald-400" />
            <span>旅行相殺</span>
            {expenses.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                {expenses.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>思い出アルバム</span>
            {photos.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-950 text-zinc-300 border border-zinc-800 font-mono">
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
