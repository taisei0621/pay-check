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

  const validNames = input.participant_names
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

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
 */
export function calculatePaymentSummary(
  amountPerPerson: number,
  payments: readonly PaymentEntity[]
): PaymentSummary {
  const totalParticipants = payments.length;
  const paidCount = payments.filter((p) => p.is_paid).length;
  const unpaidCount = totalParticipants - paidCount;

  const safeAmount = Math.max(0, amountPerPerson);
  const totalExpectedAmount = safeAmount * totalParticipants;
  const totalCollectedAmount = safeAmount * paidCount;
  const remainingAmount = safeAmount * unpaidCount;
  const progressPercentage =
    totalParticipants > 0 ? Math.round((paidCount / totalParticipants) * 100) : 0;

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
