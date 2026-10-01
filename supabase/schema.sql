-- 1. UUID拡張の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. イベントテーブル (events)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    amount_per_person INTEGER NOT NULL CHECK (amount_per_person >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. 参加者・支払い管理テーブル (payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. インデックス作成 (イベントIDでの参照を高速化)
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments(event_id);

-- 5. 行レベルセキュリティ (RLS) の設定 (シンプルさ維持: 認証なし・URLを知っていれば全アクセス許可)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for events"
    ON public.events FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public read-write for payments"
    ON public.payments FOR ALL
    USING (true)
    WITH CHECK (true);
