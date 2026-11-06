'use client';

import React, { useState, KeyboardEvent, ClipboardEvent } from 'react';
import { Plus, X, Users, Edit3, Check } from 'lucide-react';

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

    const newItem: ParticipantItem = {
      id: crypto.randomUUID(),
      name: trimmed,
      custom_amount: null,
    };
    onChange([...participants, newItem]);
    setInputValue('');
  };

  // キー入力
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddName(inputValue);
    }
  };

  // 複数行ペースト対応
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

  // 削除
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

  // 個別金額のリセット
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
        <label className="flex items-center text-xs font-semibold text-zinc-300">
          <Users className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
          参加メンバー <span className="text-red-400 ml-1">*</span>
        </label>
        {participants.length > 0 && (
          <span className="text-xs font-mono text-zinc-400">
            {participants.length}名
          </span>
        )}
      </div>

      {/* 入力フィールド＋追加ボタン */}
      <div className="flex gap-2 mb-2.5">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="名前を入力、またはLINEリストを貼り付け"
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-none ${
            error
              ? 'border-red-500 focus:border-red-400'
              : 'border-zinc-800 focus:border-zinc-500'
          }`}
        />
        <button
          type="button"
          onClick={() => handleAddName(inputValue)}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold rounded-xl transition cursor-pointer shrink-0 border border-zinc-700"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          追加
        </button>
      </div>

      {error && <p className="text-xs text-red-400 mb-2 font-medium">{error}</p>}

      {/* タグ表示領域 */}
      {participants.length > 0 ? (
        <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 min-h-[46px] flex flex-wrap gap-1.5 items-center">
          {participants.map((item) => {
            const isEditing = editingId === item.id;
            const hasCustomAmount =
              item.custom_amount !== null &&
              item.custom_amount !== undefined &&
              item.custom_amount !== baseAmount;

            return (
              <div
                key={item.id}
                className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-medium transition ${
                  hasCustomAmount
                    ? 'bg-amber-950/60 text-amber-200 border border-amber-800/60'
                    : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
                }`}
              >
                <span>{item.name}</span>

                {/* 個別金額バッジ */}
                {hasCustomAmount ? (
                  <span className="bg-amber-900/60 text-amber-300 px-1.5 py-0.2 rounded text-[10px] font-mono">
                    ¥{item.custom_amount?.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-zinc-500 text-[10px] font-mono">
                    ¥{baseAmount.toLocaleString()}
                  </span>
                )}

                {/* 個別金額編集 */}
                {isEditing ? (
                  <div className="flex items-center gap-1 ml-1 bg-zinc-950 p-1 rounded-md border border-zinc-700">
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={customAmountInput}
                      onChange={(e) => setCustomAmountInput(e.target.value)}
                      className="w-16 px-1.5 py-0.5 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-100 font-mono"
                      placeholder="金額"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveCustomAmount(item.id)}
                      className="p-1 text-emerald-400 hover:bg-zinc-800 rounded"
                      title="保存"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetCustomAmount(item.id)}
                      className="p-1 text-zinc-400 hover:bg-zinc-800 rounded text-[10px]"
                      title="リセット"
                    >
                      解除
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartEditAmount(item)}
                    className="p-1 text-zinc-500 hover:text-zinc-300 rounded transition cursor-pointer"
                    title="傾斜金額を設定"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}

                {/* 削除ボタン */}
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="p-1 text-zinc-500 hover:text-red-400 rounded transition cursor-pointer"
                  title="削除"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3 bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
          参加メンバーを入力またはペーストしてください
        </div>
      )}
    </div>
  );
};
