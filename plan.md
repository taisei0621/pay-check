# PayCheck 実装計画書 (plan.md)
**プロジェクト**: PayCheck（1タップ集金・未払い可視化ツール）  
**役割**: リードエンジニア  
**フェーズ**: 精算モデル刷新（立替総額と送金指示の明確化）およびミニマルUIリファクタリング  

---

## 1. 概要と課題解決
### 課題
1. **テキスト過多による視認性低下**: 説明文や補足が多すぎて画面が煩雑になっていた。
2. **集金の本質との乖離**: 「1人あたりの金額」を入力する形式だと、立替者がいくら支払って、誰が誰にいくら送金すればよいのかが直感的に分からない。

### 解決方針
1. **送金指示のダイレクト化**:
   - 「立替総額（例: 12,000円）」と「立替者（例: 田中）」を入力すると、参加者ごとの負担額を自動計算。
   - 画面上で **「佐藤 ➡️ 田中へ ¥3,000」** という具体的な送金指示を明示。
   - 立替者本人は回収対象から自動除外（自分への支払いは発生せず、立替額と回収状況のみ表示）。
2. **文字を極限まで削ったミニマルUI**:
   - 不要な装飾テキスト、長い注釈文、過剰なバッジを全撤去。
   - 大きな数字と直感的なカード、矢印表示だけで一目で伝わるデザインに刷新。

---

## 2. データ構造と計算モデルの更新

### 2.1 データベース (`supabase/schema.sql`)
- `events` テーブルに `total_amount`（立替総額）を追加。
  ※従来の `amount_per_person` も互換保持。

```sql
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS total_amount INTEGER;
```

### 2.2 TypeScript 型定義 (`src/types/database.ts`)
```typescript
export interface EventEntity {
  id: string;
  title: string;
  total_amount?: number | null;         // 立替総額
  amount_per_person: number;            // 1人あたり負担額
  payer_name?: string | null;           // 立替者
  payment_destination?: string | null;  // 集金先（PayPay等）
  created_at: string;
  updated_at: string;
}

export interface PaymentTransferItem {
  id: string;
  fromName: string;                     // 支払う人
  toName: string;                       // 送金先（立替者）
  amount: number;                       // 支払う金額
  is_paid: boolean;
  isPayer: boolean;                     // 立替者本人かどうか
}

export interface SettlementSummary {
  totalAmount: number;                  // 立替総額
  payerName: string;                    // 立替者名
  perPersonAmount: number;              // 1人あたり負担額
  collectTargetAmount: number;          // 回収すべき総額（立替者分を除く）
  collectedAmount: number;              // 回収済金額
  remainingAmount: number;              // 未回収金額
  transfers: PaymentTransferItem[];     // 誰が誰にいくら払うかの一覧
  progressPercentage: number;
}
```

---

## 3. 実装ステップ

### Step 1: 送金計算ロジック（純粋関数）の実装とTDDテスト
1. `src/lib/utils/payment-calc.ts` に `calculateSettlement` を実装：
   - 総額、立替者名、参加者リストから「誰が誰にいくら払うか」の送金リストと回収進捗を算出。
   - 立替者本人の負担分を識別し、回収対象を正確に算出。
2. `src/__tests__/payment-calc.test.ts` に単体テストを追加（全テスト通過を確認）。

### Step 2: データアクセス層 & スキーマの更新
1. `supabase/schema.sql` に `total_amount` を追加。
2. `src/services/eventService.ts` で `total_amount` の保存・取得に対応。

### Step 3: ミニマルで直感的なUIへの刷新
1. **イベント作成画面 (`EventCreateForm.tsx`, `page.tsx`)**:
   - 説明文を徹底的に削ぎ落とし、すっきりとした入力欄のみ配置。
   - 「イベント名」「立替総額」「立替者（参加者からワンタップ選択）」「参加者タグ」「集金先」を整然と配置。
2. **イベント詳細画面 (`events/[id]/page.tsx`, `SummaryCard.tsx`, `ParticipantList.tsx`)**:
   - 画面上部: **「田中さんが ¥12,000 を立替済」** を大きく明示。
   - 回収進捗: **「あと ¥9,000（3人）」** のシンプルな表示。
   - 一覧表示:
     - `佐藤 ➡️ 田中へ ¥3,000` [未払い / 支払済]
     - `鈴木 ➡️ 田中へ ¥3,000` [未払い / 支払済]
     - `田中 (立替者)` [立替済]

### Step 4: テスト検証 & 本番デプロイ
1. `npm test` によるVitest単体テスト全件通過（9件合格）。
2. `npx tsc --noEmit` による型チェックエラー0。
3. `npm run build` による本番ビルド通過。
4. GitHubへのプッシュ（main/master）。

---

## 4. 完了確認
- 全テスト（Vitest 9件）合格
- Next.js 本番ビルド成功（エラー0件）
- ミニマルUIへの刷新完了
- 立替総額および送金精算モデルの実装完了
