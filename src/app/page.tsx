import { EventCreateForm } from '@/components/EventCreateForm';
import {
  CheckCircle2,
  TrendingUp,
  Receipt,
  Sparkles,
  Camera,
} from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white mb-2.5 shadow-md shadow-blue-500/20">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            PayCheck
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
            立替と送金をシンプルに管理
          </p>

          {/* 4大特徴ピル */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              旅行・複数立替相殺
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs">
              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
              レシート写真添付
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs">
              <Camera className="w-3.5 h-3.5 text-amber-500" />
              思い出アルバム
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-slate-200/80 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              100%達成スライドショー
            </span>
          </div>
        </div>

        {/* フォーム */}
        <EventCreateForm />

        {/* フッター */}
        <footer className="mt-10 text-center text-xs text-slate-400 font-medium">
          <p>PayCheck © 2026</p>
        </footer>
      </div>
    </main>
  );
}
