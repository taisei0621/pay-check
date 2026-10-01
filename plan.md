# PayCheck 実装計画書 (plan.md)
**プロジェクト**: PayCheck（1タップ集金・未払い可視化ツール）  
**役割**: リードエンジニア  
**フェーズ**: 第1週 垂直スライス（全層貫通）実装計画  

---

## 1. 概要と目標
本計画は、ユーザー（幹事）がイベント情報と参加者を登録し、発行された固有URLにて参加者の「未払い/支払い済」を1タップで切り替え・永続化できる最小限の垂直スライス（全層貫通機能）を構築することを目的とします。

プロジェクト行動規範（`.antigravity/rules.md`）に従い、以下の原則を徹底します：
- **型安全の徹底**: `any` 型の完全禁止
- **関心の分離**: UI、データアクセス層（Supabase）、純粋ビジネスロジックの明確な分離
- **シンプルさの維持**: 複雑な認証は行わず、イベントUUIDベースの匿名アクセス
- **テストの配備**: Vitestによるロジックの単体テスト

---

## 2. アーキテクチャとディレクトリ構造

### 2.1 ディレクトリ設計
```text
pay-check/
├── .antigravity/
│   └── rules.md                  # 行動規範
├── plan.md                       # 本実装計画書
├── supabase/
│   └── schema.sql                # データベース定義 (SQL DDL & RLS)
├── src/
│   ├── app/
│   │   ├── layout.tsx            # ルートレイアウト
│   │   ├── page.tsx              # イベント作成画面（トップ）
│   │   └── events/
│   │       └── [id]/
│   │           └── page.tsx      # イベント管理・支払い状況可視化画面
│   ├── components/
│   │   ├── ui/                   # 共通UI部品 (Button, Input, Card等)
│   │   ├── EventCreateForm.tsx   # イベント作成フォーム (UI層)
│   │   ├── ParticipantList.tsx   # 参加者リスト・トグル (UI層)
│   │   └── SummaryCard.tsx       # 集金進捗サマリー表示 (UI層)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Supabaseブラウザクライアント
│   │   │   └── server.ts         # Supabaseサーバークライアント
│   │   └── utils/
│   │       └── payment-calc.ts   # 集金進捗・計算ロジック（純粋関数）
│   ├── services/
│   │   └── eventService.ts       # Supabase連携データアクセス層
│   ├── types/
│   │   └── database.ts           # ドメインモデル・DB型定義
│   └── __tests__/
│       ├── payment-calc.test.ts  # 純粋関数の単体テスト
│       └── eventService.test.ts  # データアクセス層のテスト/モック
├── vitest.config.ts              # Vitest設定ファイル
├── tailwind.config.ts            # Tailwind CSS設定
├── tsconfig.json                 # TypeScript設定 (strict: true)
└── package.json
```

### 2.2 依存パッケージ一覧
- **フレームワーク & UI**:
  - `next`: ^14 or ^15 (App Router)
  - `react`, `react-dom`
  - `tailwindcss`, `postcss`, `autoprefixer`
  - `lucide-react`: アイコン（チェックマーク、クリップボードコピー等）
- **バックエンド / データベース**:
  - `@supabase/supabase-js`: SupabaseクライアントSDK
  - `@supabase/ssr`: Next.js App Router向けSupabase SSRヘルパー
- **テスト & 品質**:
  - `vitest`: 高速ユニットテストフレームワーク
  - `@testing-library/react`, `@testing-library/jest-dom`: コンポーネント/DOM検証用
  - `jsdom`: テスト実行DOM環境
  - `typescript`: 型チェック (厳格モード)

---

## 3. データ構造 & 型定義

### 3.1 SQL スキーマ案 (`supabase/schema.sql`)
```sql
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

-- 5. 行レベルセキュリティ (RLS) の設定 (シンプルさ維持: イベントIDを知っていれば操作可能)
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
```

### 3.2 TypeScript 型定義 (`src/types/database.ts`)
```typescript
/** イベントエンティティ */
export interface EventEntity {
  id: string;
  title: string;
  amount_per_person: number;
  created_at: string;
  updated_at: string;
}

/** 支払い・参加者エンティティ */
export interface PaymentEntity {
  id: string;
  event_id: string;
  participant_name: string;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

/** イベント作成リクエスト入力型 */
export interface CreateEventInput {
  title: string;
  amount_per_person: number;
  participant_names: string[];
}

/** イベント詳細・画面表示用集約型 */
export interface EventWithPayments extends EventEntity {
  payments: PaymentEntity[];
}

/** 集金サマリー集計型 */
export interface PaymentSummary {
  totalParticipants: number;
  paidCount: number;
  unpaidCount: number;
  totalExpectedAmount: number;
  totalCollectedAmount: number;
  remainingAmount: number;
}
```

---

## 4. 第1週 垂直スライス実装ステップ

### Step 1: プロジェクトの初期化 & 設定
1. Next.js プロジェクトのセットアップ (App Router, TypeScript, Tailwind CSS, `src/` ディレクトリ構成)
2. 必要なパッケージのインストール (`@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`, `vitest`, `jsdom` 等)
3. Vitest の設定 (`vitest.config.ts`) と動作確認用テストの実行確認
4. 環境変数テンプレート (`.env.example`) の整備 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### Step 2: データレイヤー & ロジックの構築（TDDベース）
1. `src/types/database.ts` に型定義を作成。
2. 集金計算ロジック (`src/lib/utils/payment-calc.ts`) を純粋関数として実装:
   - 集計計算関数 `calculatePaymentSummary(amountPerPerson, payments): PaymentSummary`
   - 入力バリデーション関数 `validateEventInput(input): { valid: boolean; errors: Record<string, string> }`
3. Vitest による単体テスト作成 & パス確認 (`src/__tests__/payment-calc.test.ts`)
4. Supabase クライアント・サービスクラス (`src/services/eventService.ts`) の実装:
   - `createEventWithParticipants(input: CreateEventInput): Promise<string>`
   - `getEventWithPayments(eventId: string): Promise<EventWithPayments | null>`
   - `togglePaymentStatus(paymentId: string, currentStatus: boolean): Promise<boolean>`

### Step 3: UIコンポーネントの実装
1. `src/components/EventCreateForm.tsx`:
   - イベント名、金額、参加者名（複数行テキストエリアまたは動的追加リスト）
   - クライアント側バリデーション
   - 作成後の `/events/[id]` 遷移
2. `src/components/ParticipantList.tsx`:
   - 参加者一覧テーブル/リスト
   - 「未払い/支払い済」1タップトグルボタン
   - トグル時の楽観的UI更新 (Optimistic UI) または即時反映
3. `src/components/SummaryCard.tsx`:
   - 回収済み金額 / 目標金額 / 未回収人数の進捗バー表示

### Step 4: 画面の組み立て & 全層貫通の検証
1. トップ画面 (`src/app/page.tsx`): `EventCreateForm` を配置
2. イベント管理画面 (`src/app/events/[id]/page.tsx`):
   - 該当イベントと参加者リストの取得表示
   - URL共有機能（リンクコピーボタン）
3. 動作検証:
   - イベント作成 → DB登録確認
   - 固有URL発行・遷移確認
   - 支払いトグル押下 → DB (`is_paid`, `paid_at`) 更新確認
   - ブラウザ再読み込み（リロード）後も状態が維持されていることの確認
   - `npm run test` (Vitest) による自動テスト全通過確認

---

## 5. 合意事項・確認ポイント
- 本計画書の内容で問題がなければ、**Step 1（プロジェクト初期化とパッケージ設定）** から順次着手いたします。
