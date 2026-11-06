'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Play, Pause, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { EventPhotoEntity } from '@/types/database';

interface SlideshowModalProps {
  photos: EventPhotoEntity[];
  isOpen: boolean;
  onClose: () => void;
  eventTitle?: string;
}

export const SlideshowModal: React.FC<SlideshowModalProps> = ({
  photos,
  isOpen,
  onClose,
  eventTitle = '思い出スライドショー',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // 自動再生タイマー
  useEffect(() => {
    if (!isOpen || !isPlaying || photos.length <= 1) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, photos.length, nextSlide]);

  // キーボード操作
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, nextSlide, prevSlide]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none animate-in fade-in duration-300"
    >
      {/* トップバー */}
      <div className="z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent">
        <div>
          <span className="text-[11px] font-semibold tracking-widest text-emerald-400 uppercase">
            回収100% 達成記念
          </span>
          <h2 className="text-base font-medium text-white truncate max-w-md">
            {eventTitle}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-mono">
            {currentIndex + 1} / {photos.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900/60 hover:bg-zinc-800 transition cursor-pointer"
            title="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* メイン写真表示部（Ken Burnsエフェクト） */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* 背景のぼかし */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-20 transform scale-110"
          style={{ backgroundImage: `url(${currentPhoto.image_data})` }}
        />

        {/* 写真本体 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={currentPhoto.id}
          src={currentPhoto.image_data}
          alt={currentPhoto.caption || '思い出写真'}
          className="relative max-h-[82vh] max-w-[92vw] object-contain rounded-lg shadow-2xl transition-all duration-1000 ease-out transform scale-100 animate-in fade-in zoom-in-95"
        />

        {/* 左右ナビゲーション */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/40 hover:bg-black/70 rounded-full backdrop-blur-xs transition cursor-pointer"
              title="前の写真"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/40 hover:bg-black/70 rounded-full backdrop-blur-xs transition cursor-pointer"
              title="次の写真"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* ボトムバー（キャプション・操作ボタン・プログレスインジケーター） */}
      <div className="z-10 px-6 py-5 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center gap-3">
        {/* キャプションと投稿者 */}
        <div className="text-center max-w-xl">
          {currentPhoto.caption && (
            <p className="text-sm font-medium text-white mb-0.5">
              {currentPhoto.caption}
            </p>
          )}
          {currentPhoto.uploader_name && (
            <p className="text-xs text-zinc-400">
              撮影者・投稿者: {currentPhoto.uploader_name}
            </p>
          )}
        </div>

        {/* コントロール */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-medium backdrop-blur-xs transition cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>一時停止</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>自動再生</span>
              </>
            )}
          </button>
        </div>

        {/* インジケータードット */}
        <div className="flex items-center gap-1.5 max-w-full overflow-x-auto py-1">
          {photos.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentIndex
                  ? 'w-6 bg-white'
                  : 'w-1.5 bg-zinc-600 hover:bg-zinc-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
