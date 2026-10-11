/**
 * PayCheck データベース・ドメイン型定義
 * 行動規範: any型の完全禁止、厳格な型定義
 */

/** イベントエンティティ (eventsテーブル) */
export interface EventEntity {
  id: string;
  title: string;
  amount_per_person: number;
  payer_name?: string | null;           // 立替者（誰が支払ったか）
  payment_destination?: string | null;  // 集金先・送金先（誰にどう集めるか）
  created_at: string;
  updated_at: string;
}

/** 参加者・支払いエンティティ (paymentsテーブル) */
export interface PaymentEntity {
  id: string;
  event_id: string;
  participant_name: string;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

/** イベント作成入力パラメータ */
export interface CreateEventInput {
  title: string;
  amount_per_person: number;
  participant_names: string[];
  payer_name?: string;                  // 立替者名（任意）
  payment_destination?: string;         // 集金先情報（任意）
}

/** イベント詳細・支払い一覧を含む集約モデル */
export interface EventWithPayments extends EventEntity {
  payments: PaymentEntity[];
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
