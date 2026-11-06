import { EventCreateForm } from '@/components/EventCreateForm';
import {
  ShieldCheck,
  TrendingUp,
  Receipt,
  Sparkles,
  Camera,
} from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 mb-3 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            PayCheck
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
            飲み会や旅行の精算を、大人にふさわしい上質な体験に。
          </p>

          {/* 4大特徴ピル */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] text-zinc-400">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800/80">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              旅行・複数立替相殺
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800/80">
              <Receipt className="w-3 h-3 text-zinc-300" />
              レシート透明性保証
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800/80">
              <Camera className="w-3 h-3 text-amber-400" />
              思い出アルバム
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800/80">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              100%達成スライドショー
            </span>
          </div>
        </div>

        {/* 作成フォーム */}
        <EventCreateForm />

        {/* フッター */}
        <footer className="mt-12 text-center text-[11px] text-zinc-600">
          <p>PayCheck - 精算を、スマートで心地よい記憶に。</p>
        </footer>
      </div>
    </main>
  );
}
