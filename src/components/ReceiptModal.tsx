'use client';

import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface ReceiptModalProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  imageUrl,
  title = 'レシート明細',
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 text-white">
          <h4 className="text-sm font-semibold truncate">{title}</h4>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download="receipt.jpg"
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition"
              title="保存"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition cursor-pointer"
              title="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 画像表示エリア */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-zinc-900/50 min-h-[300px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-md"
          />
        </div>
      </div>
    </div>
  );
};
