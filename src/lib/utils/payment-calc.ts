import {
  PaymentEntity,
  PaymentSummary,
  CreateEventInput,
  SettlementSummary,
  PaymentTransferItem,
  EventEntity,
} from '@/types/database';

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

  // total_amount または amount_per_person のいずれかが0以上であること
  const hasValidTotal =
    typeof input.total_amount === 'number' && input.total_amount >= 0;
  const hasValidPerPerson =
    typeof input.amount_per_person === 'number' && input.amount_per_person >= 0;

  if (!hasValidTotal && !hasValidPerPerson) {
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
 * 誰が誰にいくら払うかの精算サマリーを算出する純粋関数
 */
export function calculateSettlement(
  event: Pick<EventEntity, 'amount_per_person' | 'total_amount' | 'payer_name'>,
  payments: readonly PaymentEntity[]
): SettlementSummary {
  const totalCount = payments.length;
  const payerName = event.payer_name?.trim() || null;

  // 1人あたりの基本金額（total_amount があれば頭割り、なければ amount_per_person）
  let perPersonAmount = Math.max(0, event.amount_per_person);
  if (
    typeof event.total_amount === 'number' &&
    event.total_amount > 0 &&
    totalCount > 0
  ) {
    perPersonAmount = Math.round(event.total_amount / totalCount);
  }

  const calculatedTotalAmount =
    typeof event.total_amount === 'number' && event.total_amount > 0
      ? event.total_amount
      : payments.reduce((sum, p) => {
          const itemAmount =
            typeof p.custom_amount === 'number' && p.custom_amount >= 0
              ? p.custom_amount
              : perPersonAmount;
          return sum + itemAmount;
        }, 0);

  // 各参加者の送金指示アイテムを生成
  const transfers: PaymentTransferItem[] = payments.map((p) => {
    const isPayer = Boolean(
      payerName && p.participant_name.trim().toLowerCase() === payerName.toLowerCase()
    );

    const amount =
      typeof p.custom_amount === 'number' && p.custom_amount >= 0
        ? p.custom_amount
        : perPersonAmount;

    return {
      id: p.id,
      fromName: p.participant_name,
      toName: payerName || '幹事',
      amount,
      is_paid: isPayer ? true : p.is_paid,
      isPayer,
    };
  });

  // 回収対象（立替者本人以外の参加者）
  const collectTargets = transfers.filter((t) => !t.isPayer);
  const collectTargetCount = collectTargets.length;
  const collectTargetAmount = collectTargets.reduce((sum, t) => sum + t.amount, 0);
  const collectedAmount = collectTargets
    .filter((t) => t.is_paid)
    .reduce((sum, t) => sum + t.amount, 0);
  const remainingAmount = Math.max(0, collectTargetAmount - collectedAmount);

  const paidCount = collectTargets.filter((t) => t.is_paid).length;
  const remainingCount = collectTargetCount - paidCount;

  let progressPercentage = 0;
  if (collectTargetAmount > 0) {
    progressPercentage = Math.round((collectedAmount / collectTargetAmount) * 100);
  } else if (collectTargetCount === 0 || remainingCount === 0) {
    progressPercentage = 100;
  }

  return {
    totalAmount: calculatedTotalAmount,
    payerName,
    perPersonAmount,
    collectTargetAmount,
    collectedAmount,
    remainingAmount,
    collectTargetCount,
    paidCount,
    remainingCount,
    transfers,
    progressPercentage,
  };
}

/**
 * 従来の PaymentSummary 計算（後方互換）
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
  total_amount?: number | null;
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

  if (typeof params.total_amount === 'number' && params.total_amount > 0) {
    lines.push(`立替総額: ${params.total_amount.toLocaleString()}円`);
  }

  lines.push(`1人あたりの金額: ${params.amount_per_person.toLocaleString()}円`);

  if (params.payment_destination && params.payment_destination.trim().length > 0) {
    lines.push(`集金先: ${params.payment_destination.trim()}`);
  }

  lines.push('');
  lines.push('送金と支払い確認はこちら:');
  lines.push(params.eventUrl);

  return lines.join('\n');
}
