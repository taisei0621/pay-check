import { EventCreateForm } from '@/components/EventCreateForm';
import { CheckCircle2, Zap, Share2, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/20 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        {/* ヘッダー・ロゴ */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white mb-3.5 shadow-lg shadow-blue-500/25">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            PayCheck
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-slate-600 font-semibold">
            1タップ集金・立替未払い可視化ツール
          </p>
          <p className="text-xs text-slate-400 mt-1">
            飲み会やサークルの立て替え精算を、誰でも最速で管理
          </p>

          {/* 特徴チップス */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              <Zap className="w-3 h-3 mr-1 text-amber-500" />
              ログイン不要
            </span>
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-500" />
              1タップ受取記録
            </span>
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              <Share2 className="w-3 h-3 mr-1 text-blue-500" />
              LINE案内文作成
            </span>
          </div>
        </div>

        {/* フォーム */}
        <EventCreateForm />

        {/* フッター */}
        <div className="mt-10 text-center text-xs text-slate-400 space-y-1">
          <p>面倒なアカウント登録なしでURLを発行してすぐに共有できます。</p>
          <p className="font-medium text-slate-500">PayCheck © 2026</p>
        </div>
      </div>
    </main>
  );
}
