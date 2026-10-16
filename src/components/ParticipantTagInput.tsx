'use client';

import React, { useState, KeyboardEvent, ClipboardEvent } from 'react';
import { Plus, X, Users, JapaneseYen, Edit3, Check } from 'lucide-react';

export interface ParticipantItem {
  id: string;
  name: string;
  custom_amount?: number | null;
}

interface ParticipantTagInputProps {
  participants: ParticipantItem[];
  onChange: (participants: ParticipantItem[]) => void;
  baseAmount: number;
  error?: string;
}

export const ParticipantTagInput: React.FC<ParticipantTagInputProps> = ({
  participants,
  onChange,
  baseAmount,
  error,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customAmountInput, setCustomAmountInput] = useState<string>('');

  // 1名追加
  const handleAddName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // 重複を許容しつつ一意なIDを付与
    const newItem: ParticipantItem = {
      id: crypto.randomUUID(),
      name: trimmed,
      custom_amount: null,
    };
    onChange([...participants, newItem]);
    setInputValue('');
  };

  // キー入力（Enterで追加）
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddName(inputValue);
    }
  };

  // 複数行ペースト対応（LINE等からの一括貼り付け）
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasteText = e.clipboardData.getData('text');
    if (pasteText.includes('\n')) {
      e.preventDefault();
      const names = pasteText
        .split('\n')
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      if (names.length > 0) {
        const newItems: ParticipantItem[] = names.map((name) => ({
          id: crypto.randomUUID(),
          name,
          custom_amount: null,
        }));
        onChange([...participants, ...newItems]);
        setInputValue('');
      }
    }
  };

  // タグ削除
  const handleRemove = (id: string) => {
    onChange(participants.filter((p) => p.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  // 個別金額編集の開始
  const handleStartEditAmount = (item: ParticipantItem) => {
    setEditingId(item.id);
    setCustomAmountInput(
      item.custom_amount !== null && item.custom_amount !== undefined
        ? item.custom_amount.toString()
        : baseAmount.toString()
    );
  };

  // 個別金額の保存
  const handleSaveCustomAmount = (id: string) => {
    const parsed = parseInt(customAmountInput, 10);
    const validAmount = !isNaN(parsed) && parsed >= 0 ? parsed : null;

    onChange(
      participants.map((p) =>
        p.id === id ? { ...p, custom_amount: validAmount } : p
      )
    );
    setEditingId(null);
  };

  // 個別金額のリセット（基本金額に戻す）
  const handleResetCustomAmount = (id: string) => {
    onChange(
      participants.map((p) =>
        p.id === id ? { ...p, custom_amount: null } : p
      )
    );
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="flex items-center text-sm font-bold text-slate-700">
          <Users className="w-4 h-4 mr-1.5 text-blue-600" />
          参加者リスト（タグで追加） <span className="text-red-500 ml-1 text-xs">*</span>
        </label>
        <span className="text-xs font-semibold text-slate-400">
          合計 {participants.length} 名
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-3 leading-relaxed">
        名前を入力して「追加」またはEnterキーで登録。LINE等のメンバー一覧を貼り付けると自動で複数人登録されます。
      </p>

      {/* 入力フィールド＋追加ボタン */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="例: 田中太郎（Enterで追加）"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
              error ? 'border-red-500 bg-red-50/20' : 'border-slate-200 bg-slate-50/50'
            } focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-slate-900`}
          />
        </div>
        <button
          type="button"
          onClick={() => handleAddName(inputValue)}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-sm active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 mr-1" />
          追加
        </button>
      </div>

      {error && <p className="text-xs text-red-600 mb-2 font-medium">{error}</p>}

      {/* タグ表示領域 */}
      {participants.length > 0 ? (
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 min-h-[50px] flex flex-wrap gap-2 items-center">
          {participants.map((item) => {
            const isEditing = editingId === item.id;
            const hasCustomAmount =
              item.custom_amount !== null &&
              item.custom_amount !== undefined &&
              item.custom_amount !== baseAmount;

            return (
              <div
                key={item.id}
                className={`inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  hasCustomAmount
                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                    : 'bg-white text-slate-800 border border-slate-200'
                }`}
              >
                <span>{item.name}</span>

                {/* 個別金額バッジ */}
                {hasCustomAmount ? (
                  <span className="bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded text-[11px] font-extrabold">
                    ¥{item.custom_amount?.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-slate-400 font-normal text-[11px]">
                    ¥{baseAmount.toLocaleString()}
                  </span>
                )}

                {/* 個別金額編集ポップオーバーまたは簡易トグル */}
                {isEditing ? (
                  <div className="flex items-center gap-1 ml-1 bg-white p-1 rounded-lg border border-blue-200 shadow-sm">
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={customAmountInput}
                      onChange={(e) => setCustomAmountInput(e.target.value)}
                      className="w-16 px-1.5 py-0.5 text-xs border border-slate-200 rounded text-slate-900 font-bold"
                      placeholder="金額"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveCustomAmount(item.id)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      title="保存"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetCustomAmount(item.id)}
                      className="p-1 text-slate-400 hover:bg-slate-100 rounded text-[10px]"
                      title="リセット"
                    >
                      解除
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartEditAmount(item)}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                    title="この人の金額を変更（傾斜精算）"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}

                {/* 削除ボタン */}
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer ml-0.5"
                  title="削除"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
          まだ参加者が追加されていません。上の入力欄から追加してください。
        </div>
      )}
    </div>
  );
};
