# PayCheck 実装計画書 plan.md
プロジェクト: PayCheck  
役割: リードエンジニア  
フェーズ: 大人の上質UIへの全面刷新と4大機能の実装  

---

## 1. 実装目標

### 1.1 デザイン刷新
- 安易なグラデーション、過剰な角丸、派手な影、ネオンカラーを全撤去。
- 繊細なボーダー、モノトーンとニュートラルグレー基調、端正なタイポグラフィによる洗練されたモダンUIを構築。

### 1.2 4大機能の実装
1. **複数立替の相殺計算（旅行モード）**:
   - 1つのイベント内で複数の立替（誰が何代を立て替えたか）をレシート付きで自由に追加可能。
   - 全員の立替額と負担額から純貸借額を算出し、最小の送金回数で全員が相殺完了する送金ルートを自動算出。
2. **レシート写真による明細の透明性保証**:
   - 立替ごとにレシート写真を添付可能。タップで全画面拡大閲覧できるモーダルを配備。
3. **よく使うPayPay・口座情報の1タップ入力**:
   - 過去に入力した送金先をブラウザに自動記憶し、ワンタップで即座に呼び出して入力可能に。
4. **思い出写真の共有と回収100%アンロックスライドショー**:
   - 参加メンバー全員が思い出の写真をアップロードして共有できるアルバム機能。
   - 回収完了前はロック（すりガラス表示）。回収率100%達成の瞬間に解放され、映画のようなKen Burnsエフェクトで全画面スライドショー再生。

---

## 2. 実装境界とデータ設計

### 2.1 データベース (`supabase/schema.sql`)
- `events` テーブルに `receipt_image` を追加。
- `expenses` テーブルを新設（複数立替用）。
- `event_photos` テーブルを新設（思い出アルバム用）。

### 2.2 ロジック層
- `src/lib/utils/settlement-graph.ts`:
  - 複数立替から各人の純貸借を計算し、最小送金ルートを導出する純粋関数 `calculateMultiExpenseSettlement`。
- `src/lib/utils/image-compress.ts`:
  - クライアント側でCanvasを用いて画像を軽量化するユーティリティ。
- `src/lib/utils/saved-destinations.ts`:
  - よく使う送金先をローカルストレージで管理するユーティリティ。
- 単体テスト:
  - `src/__tests__/settlement-graph.test.ts`
  - `src/__tests__/saved-destinations.test.ts`

### 2.3 UI層
- `src/components/ExpenseManager.tsx`
- `src/components/ReceiptModal.tsx`
- `src/components/PhotoAlbum.tsx`
- `src/components/SlideshowModal.tsx`
- `src/components/SavedDestinationChips.tsx`
- 既存画面（`page.tsx`, `events/[id]/page.tsx`, `SummaryCard.tsx`, `ParticipantList.tsx`, `EventCreateForm.tsx`）の全面脱AIデザインリファクタリング。

---

## 3. 実装手順

- Step 1: 型定義および相殺計算ロジック（TDD）の実装
- Step 2: データベーススキーマ更新とサービス層（`eventService.ts`）の拡張
- Step 3: 画像軽量化・レシート拡大・よく使う送金先ユーティリティの実装
- Step 4: 複数立替管理UI（`ExpenseManager.tsx`）の実装
- Step 5: 写真共有アルバムと回収100%スライドショー（`PhotoAlbum.tsx`, `SlideshowModal.tsx`）の実装
- Step 6: 全体デザインの脱AI化（上質なミニマルUIへの全面改修）
- Step 7: 単体テスト・本番ビルド検証・GitHubプッシュ
