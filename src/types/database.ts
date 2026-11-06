/**
 * PayCheck データベース・ドメイン型定義
 * 行動規範: any型の完全禁止、厳格な型定義
 */

/** イベントエンティティ (eventsテーブル) */
export interface EventEntity {
  id: string;
  title: string;
  total_amount?: number | null;         // 立替総額
  amount_per_person: number;            // 1人あたり基本金額
  payer_name?: string | null;           // 立替者（誰が支払ったか）
  payment_destination?: string | null;  // 集金先・送金先（誰にどう集めるか）
  receipt_image?: string | null;        // レシート写真データ（Base64またはURL）
  created_at: string;
  updated_at: string;
}

/** 参加者・支払いエンティティ (paymentsテーブル) */
export interface PaymentEntity {
  id: string;
  event_id: string;
  participant_name: string;
  custom_amount?: number | null;        // 個別指定金額（傾斜金額）
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 複数立替支出エンティティ (expensesテーブル) */
export interface ExpenseEntity {
  id: string;
  event_id: string;
  title: string;                        // 立替項目名（例: レンタカー、居酒屋）
  amount: number;                       // 立替金額
  payer_name: string;                   // 立替えた人
  receipt_image?: string | null;        // レシート写真
  created_at: string;
}

/** 思い出写真エンティティ (event_photosテーブル) */
export interface EventPhotoEntity {
  id: string;
  event_id: string;
  image_data: string;                   // 軽量圧縮された写真データ
  caption?: string | null;              // 写真の説明
  uploader_name?: string | null;        // 投稿者名
  created_at: string;
}

/** 参加者入力アイテム */
export interface ParticipantInputItem {
  name: string;
  custom_amount?: number | null;
}

/** イベント作成入力パラメータ */
export interface CreateEventInput {
  title: string;
  total_amount?: number | null;         // 立替総額（任意）
  amount_per_person: number;            // 1人あたり金額（または自動算出額）
  participant_names?: string[];          // 文字列配列（後方互換）
  participant_items?: ParticipantInputItem[]; // 詳細指定アイテム配列
  payer_name?: string;                  // 立替者名（任意）
  payment_destination?: string;         // 集金先情報（任意）
  receipt_image?: string | null;        // レシート写真
}

/** イベント詳細・支払い・立替・写真を含む完全モデル */
export interface EventWithPayments extends EventEntity {
  payments: PaymentEntity[];
  expenses?: ExpenseEntity[];
  photos?: EventPhotoEntity[];
}

/** 最小送金ルートアイテム */
export interface OptimalTransfer {
  from: string;
  to: string;
  amount: number;
}

/** 参加者ごとの純貸借情報 */
export interface ParticipantBalance {
  name: string;
  paidTotal: number;                    // 立替えた合計額
  shareTotal: number;                   // 本来負担すべき合計額
  netBalance: number;                   // 差額（プラス: 受取、マイナス: 支払）
}

/** 複数立替・相殺精算サマリー */
export interface MultiExpenseSummary {
  totalExpenses: number;                // 旅行全体の総支出額
  perPersonAmount: number;              // 1人あたり平均負担額
  participantBalances: ParticipantBalance[];
  optimalTransfers: OptimalTransfer[];  // 最小送金ルート
}

/** 集金サマリー計算結果 */
export interface PaymentSummary {
  totalParticipants: number;
  paidCount: number;
  unpaidCount: number;
  totalExpectedAmount: number;
  totalCollectedAmount: number;
  remainingAmount: number;
  progressPercentage: number;
}

/** 誰が誰にいくら送金するかの個別指示アイテム */
export interface PaymentTransferItem {
  id: string;
  fromName: string;                     // 支払う人
  toName: string;                       // 送金先（立替者）
  amount: number;                       // 支払うべき金額
  is_paid: boolean;
  isPayer: boolean;                     // 立替者本人かどうか
}

/** 端数丸め設定の型 */
export type RoundingUnit = 1 | 100 | 500 | 1000;
export type RoundingMethod = 'ceil' | 'floor' | 'round';

export interface RoundingOptions {
  unit?: RoundingUnit;
  method?: RoundingMethod;
}

/** 決済種別とアクション情報 */
export type PaymentMethodType = 'paypay_link' | 'paypay_id' | 'bank' | 'other';

export interface PaymentTypeInfo {
  type: PaymentMethodType;
  label: string;
  actionUrl: string | null;
  copyValue: string | null;
}

/** 精算全体のサマリー */
export interface SettlementSummary {
  totalAmount: number;                  // 立替総額
  payerName: string | null;             // 立替者名
  perPersonAmount: number;              // 1人あたり負担額
  collectTargetAmount: number;          // 回収すべき総額（立替者分を除く）
  collectedAmount: number;              // すでに回収済みの金額
  remainingAmount: number;              // あと回収すべき未回収額
  collectTargetCount: number;           // 回収対象人数（立替者を除く）
  paidCount: number;                    // 回収済人数
  remainingCount: number;               // 未回収人数
  transfers: PaymentTransferItem[];     // 送金指示リスト
  progressPercentage: number;           // 進捗率
  roundingUnit?: RoundingUnit;          // 丸め単位
  roundingMethod?: RoundingMethod;      // 丸め方式
  payerDiff?: number;                   // 端数丸めによる立替者の過不足差額
}
