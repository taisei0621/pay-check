import { EventCreateForm } from '@/components/EventCreateForm';
import { CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white mb-2.5 shadow-md shadow-blue-500/20">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            PayCheck
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            立替と送金をシンプルに管理
          </p>
        </div>

        {/* フォーム */}
        <EventCreateForm />

        {/* フッター */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>PayCheck © 2026</p>
        </div>
      </div>
    </main>
  );
}
