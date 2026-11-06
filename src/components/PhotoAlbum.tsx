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
      <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider">
              <ImageIcon className="w-4 h-4" />
              <span>思い出アルバム</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              写真共有と回収達成スライドショー
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              参加者全員で写真を持ち寄り、回収率100%達成ですべてが鮮明にアンロックされます。
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isUnlocked && photos.length > 0 && (
              <button
                type="button"
                onClick={() => setIsSlideshowOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition cursor-pointer shadow-xs active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>スライドショー再生</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsUploadOpen(!isUploadOpen)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer shadow-xs active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>写真を投稿</span>
            </button>
          </div>
        </div>

        {/* アンロックステータスバー */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          {isUnlocked ? (
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>全写真がアンロックされました！スライドショーをお楽しみください。</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>
                支払い回収完了でアンロック。現在の回収率: <strong className="text-blue-600 font-bold">{progressPercentage}%</strong>
              </span>
            </div>
          )}

          <span className="text-slate-400 font-bold">
            {photos.length} 枚
          </span>
        </div>
      </div>

      {/* 写真投稿フォーム */}
      {isUploadOpen && (
        <form
          onSubmit={handleAddPhoto}
          className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-blue-100 space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" />
              思い出の写真を投稿
            </h4>
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
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

          <div className="space-y-4">
            {/* 写真ファイル選択 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                写真ファイル
              </label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition">
                  <Camera className="w-4 h-4 text-slate-500" />
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
                      className="w-12 h-12 object-cover rounded-xl border border-slate-300 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setImageData(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  写真のひと言・キャプション
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="例: 山頂での集合写真、二次会の乾杯"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  あなたの名前
                </label>
                <input
                  type="text"
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value)}
                  placeholder="例: 佐藤"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isPending || isCompressing || !imageData}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>投稿する</span>
            </button>
          </div>
        </form>
      )}

      {/* 写真グリッド */}
      {photos.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-lg shadow-slate-200/50 border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Camera className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700 mb-1">
            まだ写真が投稿されていません
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            旅行やイベントの思い出写真を投稿しましょう。回収率100%ですべてアンロックされます。
          </p>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer shadow-xs"
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
              className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.image_data}
                alt={photo.caption || '思い出写真'}
                className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${
                  isUnlocked ? 'filter-none' : 'filter blur-md grayscale-50 scale-105'
                }`}
              />

              {/* ロックオーバーレイ */}
              {!isUnlocked && (
                <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center p-3 text-center">
                  <div className="w-9 h-9 rounded-full bg-slate-900/70 border border-white/20 flex items-center justify-center text-amber-300 mb-1 shadow-md">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-white tracking-wider">
                    回収完了で解放
                  </span>
                </div>
              )}

              {/* アンロックホバー */}
              {isUnlocked && (
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="p-1.5 bg-slate-900/70 hover:bg-red-600 text-white rounded-lg transition cursor-pointer"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    {photo.caption && (
                      <p className="text-xs font-bold text-white truncate">
                        {photo.caption}
                      </p>
                    )}
                    {photo.uploader_name && (
                      <p className="text-[10px] text-slate-200">
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
