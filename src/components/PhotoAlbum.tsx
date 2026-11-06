'use client';

import React, { useState, useTransition } from 'react';
import {
  Camera,
  Lock,
  Sparkles,
  Play,
  Trash2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { EventPhotoEntity } from '@/types/database';
import { compressImage } from '@/lib/utils/image-compress';
import { addEventPhoto, deleteEventPhoto } from '@/services/eventService';
import { SlideshowModal } from '@/components/SlideshowModal';

interface PhotoAlbumProps {
  eventId: string;
  photos: EventPhotoEntity[];
  isUnlocked: boolean;
  progressPercentage: number;
  onPhotosChange: (newPhotos: EventPhotoEntity[]) => void;
  eventTitle?: string;
}

export const PhotoAlbum: React.FC<PhotoAlbumProps> = ({
  eventId,
  photos,
  isUnlocked,
  progressPercentage,
  onPhotosChange,
  eventTitle,
}) => {
  const [isPending, startTransition] = useTransition();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);

  // フォームステート
  const [imageData, setImageData] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploaderName, setUploaderName] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 画像選択
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressed = await compressImage(file, 1200, 0.8);
      setImageData(compressed);
    } catch {
      setErrorMessage('画像の読み込みに失敗しました');
    } finally {
      setIsCompressing(false);
    }
  };

  // 写真追加
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageData) {
      setErrorMessage('写真を選択してください');
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      const result = await addEventPhoto(eventId, {
        image_data: imageData,
        caption: caption.trim() || null,
        uploader_name: uploaderName.trim() || null,
      });

      if (result.success && result.data) {
        onPhotosChange([...photos, result.data]);
        setImageData(null);
        setCaption('');
        setUploaderName('');
        setIsUploadOpen(false);
      } else {
        setErrorMessage(result.error || '写真の投稿に失敗しました');
      }
    });
  };

  // 写真削除
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('この写真をアルバムから削除しますか？')) return;

    startTransition(async () => {
      const result = await deleteEventPhoto(photoId);
      if (result.success) {
        onPhotosChange(photos.filter((p) => p.id !== photoId));
      } else {
        alert('削除に失敗しました');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* アルバムヘッダー */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>思い出アルバム</span>
            </div>
            <h3 className="text-xl font-bold text-zinc-100 mt-1">
              写真共有と回収達成スライドショー
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              参加者全員で写真を持ち寄り、回収率100%達成ですべてが鮮明にアンロックされます。
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isUnlocked && photos.length > 0 && (
              <button
                type="button"
                onClick={() => setIsSlideshowOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition cursor-pointer shadow-xs"
              >
                <Play className="w-4 h-4 fill-emerald-950" />
                <span>スライドショー再生</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsUploadOpen(!isUploadOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-xl transition cursor-pointer shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>写真を投稿</span>
            </button>
          </div>
        </div>

        {/* アンロックステータスバー */}
        <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
          {isUnlocked ? (
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>全写真がアンロックされました！スライドショーをお楽しみください。</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-400">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>
                支払い回収完了でアンロック。現在の回収率: {progressPercentage}%
              </span>
            </div>
          )}

          <span className="text-zinc-500 font-mono">
            {photos.length} 枚の写真
          </span>
        </div>
      </div>

      {/* 写真投稿フォーム */}
      {isUploadOpen && (
        <form
          onSubmit={handleAddPhoto}
          className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-md space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h4 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              思い出の写真を投稿
            </h4>
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              閉じる
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* 写真ファイル選択 */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                写真ファイル
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer transition">
                  <Camera className="w-4 h-4 text-zinc-400" />
                  <span>{isCompressing ? '軽量化処理中...' : '端末の写真を選択'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isCompressing}
                  />
                </label>

                {imageData && (
                  <div className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageData}
                      alt="プレビュー"
                      className="w-12 h-12 object-cover rounded-lg border border-zinc-700 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setImageData(null)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full flex items-center justify-center text-[10px] cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  写真のひと言・キャプション
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="例: 山頂での集合写真、二次会の乾杯"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  あなたの名前
                </label>
                <input
                  type="text"
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value)}
                  placeholder="例: 佐藤"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isPending || isCompressing || !imageData}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>投稿する</span>
            </button>
          </div>
        </form>
      )}

      {/* 写真グリッド */}
      {photos.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
            <Camera className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-zinc-300 mb-1">
            まだ写真が投稿されていません
          </p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
            旅行やイベントの思い出写真を投稿しましょう。回収率100%ですべてアンロックされます。
          </p>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-xl transition cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>最初の写真を投稿する</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xs"
            >
              {/* 写真本体 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.image_data}
                alt={photo.caption || '思い出写真'}
                className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${
                  isUnlocked ? 'filter-none' : 'filter blur-md grayscale-50 scale-105'
                }`}
              />

              {/* ロック時のオーバーレイ */}
              {!isUnlocked && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-3 text-center">
                  <div className="w-8 h-8 rounded-full bg-black/60 border border-zinc-700 flex items-center justify-center text-amber-400 mb-1">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-200 tracking-wider">
                    回収完了で解放
                  </span>
                </div>
              )}

              {/* アンロック時の情報ホバーオーバーレイ */}
              {isUnlocked && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="p-1.5 bg-black/60 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 rounded-lg transition cursor-pointer"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    {photo.caption && (
                      <p className="text-xs font-medium text-white truncate">
                        {photo.caption}
                      </p>
                    )}
                    {photo.uploader_name && (
                      <p className="text-[10px] text-zinc-400">
                        by {photo.uploader_name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* スライドショーモーダル */}
      <SlideshowModal
        photos={photos}
        isOpen={isSlideshowOpen}
        onClose={() => setIsSlideshowOpen(false)}
        eventTitle={eventTitle}
      />
    </div>
  );
};
