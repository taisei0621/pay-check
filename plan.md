# PayCheck 実装計画書 (plan.md)
**プロジェクト**: PayCheck（1タップ集金・未払い可視化ツール）  
**役割**: リードエンジニア  
**フェーズ**: 第3週 参加者タグ管理・立替者選択連動・傾斜精算実装計画  

---

## 1. 概要と目標
第2週で達成した「立替者・送金先可視化」および「UIリニューアル」をさらに進化させ、幹事の入力体験と柔軟性を大幅に強化します。

### 主な目標
1. **参加者のタグ管理インターフェース**:
   - テキストエリアではなく、名前を入力して確定キーまたは追加ボタンで1人ずつ視覚的なタグ（バッジ）として管理。
   - 各タグに削除ボタンを配置し、直感的な追加・削除を実現。
   - LINE等からの複数行一括貼り付けにも対応（改行テキストを検知して自動で複数タグに分解）。
2. **参加者タグからの立替者選択連動**:
   - 登録された参加者タグの一覧から、ワンタップで立替者を選択可能にする。
   - 手入力の手間と表記揺れを完全に防止し、参加者と立替者をシームレスに紐付け。
   - 参加者以外の立替（外部支払い）に対応する手入力切り替えも維持。
3. **傾斜精算（参加者ごとの金額個別調整）**:
   - 参加者ごとに個別の金額（遅刻者、お酒を飲まない人、多めに払う先輩など）を設定可能にする。
   - 個別金額を考慮した集金サマリー計算ロジックの拡張。

プロジェクト行動規範（`.antigravity/rules.md`）に従い、以下の原則を徹底します：
- **型安全の徹底**: `any` 型の完全禁止
- **関心の分離**: UI、データアクセス層、純粋ビジネスロジックの明確な分離
- **テストの配備**: タグ操作や傾斜配分サマリー計算に対するVitest単体テストの同時実装

---

## 2. データ構造の拡張と型定義

### 2.1 データベース拡張 (`supabase/schema.sql`)
`payments` テーブルに以下のカラムを追加：
- `custom_amount INTEGER`: 参加者個別の設定金額（任意。nullの場合はイベントの基本金額 `amount_per_person` を適用）

```sql
-- 既存テーブルへの追加移行用
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS custom_amount INTEGER;
```

### 2.2 TypeScript 型定義の更新 (`src/types/database.ts`)
```typescript
export interface ParticipantInputItem {
  name: string;
  custom_amount?: number | null;
}

export interface PaymentEntity {
  id: string;
  event_id: string;
  participant_name: string;
  custom_amount?: number | null;  // 個別指定金額
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEventInput {
  title: string;
  amount_per_person: number;
  participants: (string | ParticipantInputItem)[];
  payer_name?: string;
  payment_destination?: string;
}
```

---

## 3. 実装ステップ

### Step 1: 型定義 & 集計純粋関数の拡張とTDDテスト
1. `src/types/database.ts` に `custom_amount` および `ParticipantInputItem` 型を追加。
2. `src/lib/utils/payment-calc.ts` の `calculatePaymentSummary` を拡張：
   - 各参加者の金額を `custom_amount ?? amount_per_person` として正確に目標総額・回収済額・未回収額を集計。
3. `src/__tests__/payment-calc.test.ts` に傾斜配分時の集計テストケースを追加し、全テスト通過を確認。

### Step 2: データアクセス層 & SQLスキーマの拡張
1. `supabase/schema.sql` に `custom_amount` カラムの追加を反映。
2. `src/services/eventService.ts`:
   - `createEventWithParticipants` で個別金額 `custom_amount` の保存に対応。
   - ローカルストレージモックおよびSupabaseクエリの両方で `custom_amount` の永続化に対応。
3. `src/__tests__/eventService.test.ts` のテストケースを更新。

### Step 3: UIコンポーネントの実装
1. **新規コンポーネント**: `src/components/ParticipantTagInput.tsx`
   - 名前入力欄＋追加ボタン＋Enterキー受付。
   - 登録された参加者をタグチップとして表示（削除ボタン付き）。
   - タグごとに個別金額（傾斜金額）を設定できる小型インプット/バッジ。
   - 複数行ペースト時に自動で複数タグに分解する親切設計。
2. **フォームの改修**: `src/components/EventCreateForm.tsx`
   - テキストエリアを `ParticipantTagInput` に置き換え。
   - 「立替者」の項目で、登録された参加者タグを一覧表示し、クリックでワンタップ選択できる連動セレクターを配置。
3. **参加者リストの改修**: `src/components/ParticipantList.tsx`
   - 個別金額（傾斜金額）が設定されている参加者には「個別の支払額」を表示。

### Step 4: 結合テスト、ビルド検証、本番配備
1. `npm test` によるVitest単体テスト全件通過を確認。
2. `npx tsc --noEmit` によるTypeScript型エラー0を確認。
3. `npm run build` による本番ビルド通過を確認。
4. GitHubへのプッシュ（mainおよびmaster）による本番自動デプロイと反映確認。
