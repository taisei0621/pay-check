# PayCheck 実装計画書 (plan.md)
**プロジェクト**: PayCheck（1タップ集金・未払い可視化ツール）  
**役割**: リードエンジニア  
**フェーズ**: 第2週 立替者・集金先可視化とUI刷新計画  

---

## 1. 概要と目標
第1週で達成した垂直スライス（全層貫通機能）を基盤とし、実際の飲み会・イベントでの集金ストレスをゼロにするための機能拡張とデザイン刷新を実施します。

### 主な目標
1. **「誰が立て替えて誰に集めればよいか」の可視化**:
   - イベント作成時に立替者名（誰が支払ったか）と集金先（PayPay、銀行口座、現金など誰に渡すか）を設定可能にする。
   - イベント管理画面の最上部に送金先バナーを表示し、参加者全員が迷わず送金できるようにする。
2. **LINE・SNS向け案内文生成機能**:
   - イベント名、立替者、金額、送金先、管理URLを含んだ共有用テキストを1タップでクリップボードにコピーできる機能の配備。
3. **モバイル最適化モダンUIへの刷新**:
   - 洗練されたカラーパレット、視認性の高いカードUI、スマホで押しやすいトグルボタンへのデザインリニューアル。

プロジェクト行動規範（`.antigravity/rules.md`）に従い、以下の原則を徹底します：
- **型安全の徹底**: `any` 型の完全禁止
- **関心の分離**: UI、データアクセス層、純粋ビジネスロジックの明確な分離
- **テストの配備**: 新規追加ロジック（案内文生成等）に対するVitest単体テストの同時実装

---

## 2. データ構造の拡張と型定義

### 2.1 データベース拡張 (`supabase/schema.sql`)
`events` テーブルに以下のカラムを追加：
- `payer_name TEXT`: 立替者の名前（任意）
- `payment_destination TEXT`: 集金先・支払い方法（任意、例: 「田中のPayPay」「現金」「三井住友銀行 ◯◯支店」）

```sql
-- 既存テーブルへの追加移行用
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS payer_name TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS payment_destination TEXT;
```

### 2.2 TypeScript 型定義の更新 (`src/types/database.ts`)
```typescript
export interface EventEntity {
  id: string;
  title: string;
  amount_per_person: number;
  payer_name?: string | null;            // 立替者名
  payment_destination?: string | null;   // 集金先・送金方法
  created_at: string;
  updated_at: string;
}

export interface CreateEventInput {
  title: string;
  amount_per_person: number;
  participant_names: string[];
  payer_name?: string;
  payment_destination?: string;
}
```

---

## 3. 実装ステップ

### Step 1: 型定義 & 純粋関数の拡張とTDDテスト
1. `src/types/database.ts` に `payer_name`, `payment_destination` を追加。
2. `src/lib/utils/payment-calc.ts` に案内文生成の純粋関数 `generateShareMessage` を実装：
   - イベント名、金額、立替者、集金先、イベントURLを整形した案内テキストを生成。
3. `src/__tests__/payment-calc.test.ts` に `generateShareMessage` の単体テストを追加し、テスト通過を確認。

### Step 2: データアクセス層の拡張
1. `src/services/eventService.ts`:
   - `createEventWithParticipants` に立替者・集金先フィールドを追加。
   - ローカルストレージモックおよびSupabaseクエリの両方で立替者・集金先を正しく永続化・取得できるよう更新。
2. `src/__tests__/eventService.test.ts` のモックテストを更新してテスト通過を確認。

### Step 3: UIデザインの刷新 & 新機能コンポーネント実装
1. **新規コンポーネント**: `src/components/PayerInfoCard.tsx`
   - 立替者名と集金先（PayPayや口座など）を分かりやすく目立つバナーとして表示。
   - 未設定の場合でも邪魔にならない柔軟なUI。
2. **フォームの改修**: `src/components/EventCreateForm.tsx`
   - 「立替者（任意）」「支払い先・集金方法（任意）」の入力項目を追加。
   - よりモダンで洗練された入力フォームデザインへ刷新。
3. **サマリー & 参加者リストの刷新**:
   - `SummaryCard.tsx` / `ParticipantList.tsx` のレイアウト・配色・タイポグラフィを洗練。
   - 1タップトグルボタンの視認性とタップフィードバックを向上。
4. **案内文共有ボタンの実装**:
   - イベント画面に「LINE案内文をコピー」ボタンを追加し、ワンタップでクリップボードへコピー。

### Step 4: 結合テスト、ビルド検証、本番配備
1. `npm test` による全単体テスト通過を確認。
2. `npx tsc --noEmit` によるTypeScript型エラー0を確認。
3. `npm run build` による本番ビルド通過を確認。
4. GitHubへのプッシュ（mainブランチ）およびVercel自動デプロイによる本番公開の反映確認。
