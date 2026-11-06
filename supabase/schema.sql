-- 1. UUID拡張の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. イベントテーブル (events)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    total_amount INTEGER,
    amount_per_person INTEGER NOT NULL CHECK (amount_per_person >= 0),
    payer_name TEXT,
    payment_destination TEXT,
    receipt_image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 既存テーブルがある場合のマイグレーション用
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS total_amount INTEGER;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS payer_name TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS payment_destination TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS receipt_image TEXT;

-- 3. 参加者・支払い管理テーブル (payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    custom_amount INTEGER,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS custom_amount INTEGER;
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments(event_id);

-- 4. 複数立替支出テーブル (expenses - 旅行モード用)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount >= 0),
    payer_name TEXT NOT NULL,
    receipt_image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON public.expenses(event_id);

-- 5. 思い出写真テーブル (event_photos - アルバム・スライドショー用)
CREATE TABLE IF NOT EXISTS public.event_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    image_data TEXT NOT NULL,
    caption TEXT,
    uploader_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON public.event_photos(event_id);

-- 6. 行レベルセキュリティ (RLS) の設定 (シンプルさ維持: 認証なし・URLを知っていればアクセス許可)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for events"
    ON public.events FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public read-write for payments"
    ON public.payments FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public read-write for expenses"
    ON public.expenses FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public read-write for event_photos"
    ON public.event_photos FOR ALL
    USING (true)
    WITH CHECK (true);
