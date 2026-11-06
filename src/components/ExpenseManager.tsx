'use client';

import React, { useState, useTransition } from 'react';
import {
  Plus,
  Trash2,
  Receipt,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Users,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ExpenseEntity } from '@/types/database';
import { calculateMultiExpenseSettlement } from '@/lib/utils/settlement-graph';
import { compressImage } from '@/lib/utils/image-compress';
import { addExpense, deleteExpense } from '@/services/eventService';
import { ReceiptModal } from '@/components/ReceiptModal';

interface ExpenseManagerProps {
  eventId: string;
  participantNames: string[];
  expenses: ExpenseEntity[];
  onExpensesChange: (newExpenses: ExpenseEntity[]) => void;
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  eventId,
  participantNames,
  expenses,
  onExpensesChange,
}) => {
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // フォームステート
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [payerName, setPayerName] = useState(participantNames[0] || '');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // レシートモーダル用
  const [selectedReceipt, setSelectedReceipt] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // 相殺計算結果
  const settlement = calculateMultiExpenseSettlement(participantNames, expenses);

  // 写真選択ハンドラ
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // 支出追加
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(amountStr);
    if (!title.trim()) {
      setErrorMessage('立替の項目名を入力してください');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('有効な金額を入力してください');
      return;
    }
    if (!payerName.trim()) {
      setErrorMessage('立替者を選択または入力してください');
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      const result = await addExpense(eventId, {
        title: title.trim(),
        amount,
        payer_name: payerName.trim(),
        receipt_image: receiptImage,
      });

      if (result.success && result.data) {
        onExpensesChange([...expenses, result.data]);
        setTitle('');
        setAmountStr('');
        setReceiptImage(null);
        setIsFormOpen(false);
      } else {
        setErrorMessage(result.error || '立替の追加に失敗しました');
      }
    });
  };

  // 支出削除
  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('この立替記録を削除しますか？')) return;

    startTransition(async () => {
      const result = await deleteExpense(expenseId);
      if (result.success) {
        onExpensesChange(expenses.filter((e) => e.id !== expenseId));
      } else {
        alert('削除に失敗しました');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 相殺精算サマリーヘッダー */}
      <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>旅行・複数立替モード</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              立替記録と自動相殺ルート
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>立替を追加する</span>
          </button>
        </div>

        {/* 支出総額・平均 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-5">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-medium text-slate-500">総立替額</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              ¥{settlement.totalExpenses.toLocaleString()}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
            <span className="text-xs font-medium text-blue-600">1人あたり平均</span>
            <div className="text-xl sm:text-2xl font-black text-blue-700 mt-0.5">
              ¥{settlement.perPersonAmount.toLocaleString()}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
            <span className="text-xs font-medium text-slate-500">記録件数</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {expenses.length} 件
            </div>
          </div>
        </div>
      </div>

      {/* 支出追加フォーム */}
      {isFormOpen && (
        <form
          onSubmit={handleAddExpense}
          className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-blue-100 space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              新しい立替を記録
            </h4>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
            >
              閉じる
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 項目名 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                項目名
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: レンタカー代、居酒屋一次会"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            {/* 金額 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                立替金額
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                  ¥
                </span>
                <input
                  type="number"
                  min="1"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="15000"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* 立替者 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                立替えた人
              </label>
              <select
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition"
              >
                {participantNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* レシート写真 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                レシート写真の添付
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition">
                  <Camera className="w-4 h-4 text-slate-500" />
                  <span>{isCompressing ? '圧縮処理中...' : '写真を選択'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
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
                      className="w-10 h-10 object-cover rounded-lg border border-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setReceiptImage(null)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isPending || isCompressing}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>登録する</span>
            </button>
          </div>
        </form>
      )}

      {/* 最小送金ルート・相殺精算指示カード */}
      <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <h4 className="text-base font-bold text-slate-900">
            最小送金ルートによる相殺精算
          </h4>
        </div>

        {settlement.optimalTransfers.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            {expenses.length === 0
              ? '立替記録を追加すると、全員の送金を最小回数で相殺する送金指示が自動計算されます。'
              : '全員の立替額が均等であるため、送金の必要はありません。'}
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            <p className="text-xs text-slate-500 font-medium">
              各自が個別に送金し合う代わりに、以下の送金を行うだけで全員の貸借が完全に清算されます。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {settlement.optimalTransfers.map((transfer, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-200 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-900 text-sm">
                      {transfer.from}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-slate-900 text-sm">
                      {transfer.to}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-blue-600">
                      ¥{transfer.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 各自の立替・負担収支一覧 */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-3">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>メンバーごとの立替合計と純貸借額</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {settlement.participantBalances.map((bal) => {
              const isPlus = bal.netBalance > 0;
              const isZero = bal.netBalance === 0;

              return (
                <div
                  key={bal.name}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">
                      {bal.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      立替: ¥{bal.paidTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-black ${
                        isZero
                          ? 'text-slate-400'
                          : isPlus
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {isPlus ? '+' : ''}¥{bal.netBalance.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isZero ? '精算なし' : isPlus ? '受取超過' : '支払不足'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 登録済み支出一覧 */}
      <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
        <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-blue-600" />
          <span>立替明細一覧</span>
          <span className="text-xs font-medium text-slate-400 ml-1">
            合計 {expenses.length} 件
          </span>
        </h4>

        {expenses.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            まだ立替は記録されていません。右上の「立替を追加する」から登録してください。
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="py-3.5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {expense.receipt_image ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedReceipt({
                          url: expense.receipt_image!,
                          title: expense.title,
                        })
                      }
                      className="relative shrink-0 w-11 h-11 rounded-xl overflow-hidden border border-slate-200 hover:border-blue-400 transition group cursor-pointer shadow-xs"
                      title="レシートを拡大表示"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={expense.receipt_image}
                        alt={expense.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    </button>
                  ) : (
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {expense.title}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      立替者: <span className="text-slate-700 font-bold">{expense.payer_name}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-base font-black text-slate-900">
                    ¥{expense.amount.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer rounded-lg hover:bg-red-50"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* レシート拡大モーダル */}
      <ReceiptModal
        imageUrl={selectedReceipt?.url || null}
        title={selectedReceipt?.title || 'レシート明細'}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
