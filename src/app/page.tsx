import { EventCreateForm } from '@/components/EventCreateForm';
import { CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white mb-3 shadow-md shadow-blue-500/20">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            PayCheck
          </h1>
          <p className="mt-2 text-sm text-gray-600 font-medium">
            1タップ集金・未払い可視化ツール
          </p>
        </div>

        <EventCreateForm />

        <div className="mt-8 text-center text-xs text-gray-400">
          面倒なログイン不要。URLを共有・保存するだけですぐに使えます。
        </div>
      </div>
    </main>
  );
}
