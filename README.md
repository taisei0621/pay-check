# PayCheck（ペイチェック）

**1タップ集金・未払い可視化ツール**

飲み会やイベントの幹事が直面する「集金の手間」や「誰が払ったか分からない問題」を解決する、シンプルかつ高機能なWebツールです。  
面倒な会員登録やログインは不要。イベント名と参加者を登録するだけで固有URLが発行され、参加者ごとの「未払い / 支払い済」を1タップで切り替え・管理できます。

---

## 主な機能（第1週 垂直スライス）
- **イベント作成**: イベント名、1人あたりの金額、参加者名（複数行ペースト対応）を入力して即時作成
- **URL発行・共有**: イベント固有のUUIDを持つURLを発行し、1クリックでコピー可能
- **1タップ支払いステータス切り替え**: 参加者リストの横にあるボタンをタップして「未払い / 支払い済」を即座に更新
- **集金進捗のリアルタイム可視化**: 回収済み人数・金額、未回収人数・金額、進捗率（%）をダッシュボード表示
- **ステータス永続化**: ページを再読み込み（リロード）しても状態を維持

---

## 技術スタック
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **Backend / Database**: Supabase (PostgreSQL, RLS)
- **Testing**: Vitest, React Testing Library, jsdom
- **Hosting / Deploy**: Vercel

---

## ローカル開発手順

### 1. 依存パッケージのインストール
```bash
npm install
```

### 2. 環境変数の設定（任意）
Supabase を接続する場合は `.env.local` を作成します（未設定時もローカルストレージで全機能テスト可能です）：
```bash
cp .env.example .env.local
```

### 3. 開発サーバーの起動
```bash
npm run dev
```
ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### 4. テストの実行
```bash
npm test
```

---

## デプロイ（Vercel）
1. [Vercel](https://vercel.com/new) にアクセス
2. GitHub リポジトリ（`taisei0621/pay-check`）をインポート
3. 必要に応じて環境変数（`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`）を設定して「Deploy」をクリック
