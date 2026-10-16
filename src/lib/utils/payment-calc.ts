import { PaymentEntity, PaymentSummary, CreateEventInput } from '@/types/database';

/**
 * イベント入力値のバリデーション結果型
 */
export interface ValidationResult {
  isValid: boolean;
  errors: {
    title?: string;
    amount?: string;
    participants?: string;
  };
}

/**
 * イベント作成フォームの入力を検証する純粋関数
 */
export function validateEventInput(input: CreateEventInput): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  if (!input.title || input.title.trim() === '') {
    errors.title = 'イベント名を入力してください';
  }

  if (isNaN(input.amount_per_person) || input.amount_per_person < 0) {
    errors.amount = '0円以上の金額を入力してください';
  }

  // participant_items または participant_names のいずれかから有効な名前を抽出
  const validNames = (
    input.participant_items
      ? input.participant_items.map((item) => item.name.trim())
      : input.participant_names
      ? input.participant_names.map((name) => name.trim())
      : []
  ).filter((name) => name.length > 0);

  if (validNames.length === 0) {
    errors.participants = '1名以上の参加者を入力してください';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * 参加者の集金サマリー（回収済み金額・未回収額・進捗率等）を計算する純粋関数
 * 個別金額（custom_amount）が設定されている場合はそれを優先し、未設定の場合は基本金額を使用
 */
export function calculatePaymentSummary(
  amountPerPerson: number,
  payments: readonly PaymentEntity[]
): PaymentSummary {
  const totalParticipants = payments.length;
  const paidCount = payments.filter((p) => p.is_paid).length;
  const unpaidCount = totalParticipants - paidCount;

  const safeAmount = Math.max(0, amountPerPerson);

  const getAmount = (p: PaymentEntity): number => {
    if (typeof p.custom_amount === 'number' && p.custom_amount >= 0) {
      return p.custom_amount;
    }
    return safeAmount;
  };

  const totalExpectedAmount = payments.reduce((sum, p) => sum + getAmount(p), 0);
  const totalCollectedAmount = payments
    .filter((p) => p.is_paid)
    .reduce((sum, p) => sum + getAmount(p), 0);
  const remainingAmount = Math.max(0, totalExpectedAmount - totalCollectedAmount);

  let progressPercentage = 0;
  if (totalExpectedAmount > 0) {
    progressPercentage = Math.round((totalCollectedAmount / totalExpectedAmount) * 100);
  } else if (totalParticipants > 0 && paidCount === totalParticipants) {
    progressPercentage = 100;
  }

  return {
    totalParticipants,
    paidCount,
    unpaidCount,
    totalExpectedAmount,
    totalCollectedAmount,
    remainingAmount,
    progressPercentage,
  };
}

/**
 * LINEやSNSで共有する集金案内文のパラメータ
 */
export interface ShareMessageParams {
  title: string;
  amount_per_person: number;
  payer_name?: string | null;
  payment_destination?: string | null;
  eventUrl: string;
}

/**
 * 集金案内用の共有テキストを生成する純粋関数
 */
export function generateShareMessage(params: ShareMessageParams): string {
  const lines: string[] = [`【${params.title}の集金案内】`];

  if (params.payer_name && params.payer_name.trim().length > 0) {
    lines.push(`立替者: ${params.payer_name.trim()}`);
  }

  lines.push(`金額: 1人 ${params.amount_per_person.toLocaleString()}円`);

  if (params.payment_destination && params.payment_destination.trim().length > 0) {
    lines.push(`集金・支払い先: ${params.payment_destination.trim()}`);
  }

  lines.push('');
  lines.push('集金状況の確認・支払い完了はこちら:');
  lines.push(params.eventUrl);

  return lines.join('\n');
}
