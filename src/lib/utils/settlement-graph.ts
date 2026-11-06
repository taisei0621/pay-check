import {
  ExpenseEntity,
  MultiExpenseSummary,
  OptimalTransfer,
  ParticipantBalance,
} from '@/types/database';

/**
 * 複数立替（旅行モード）の相殺計算および最小送金ルートを導出する純粋関数
 */
export function calculateMultiExpenseSettlement(
  participantNames: readonly string[],
  expenses: readonly Pick<ExpenseEntity, 'title' | 'amount' | 'payer_name'>[]
): MultiExpenseSummary {
  const normalizedParticipants = Array.from(
    new Set(participantNames.map((n) => n.trim()).filter((n) => n.length > 0))
  );

  const participantCount = normalizedParticipants.length;

  if (participantCount === 0 || expenses.length === 0) {
    return {
      totalExpenses: 0,
      perPersonAmount: 0,
      participantBalances: normalizedParticipants.map((name) => ({
        name,
        paidTotal: 0,
        shareTotal: 0,
        netBalance: 0,
      })),
      optimalTransfers: [],
    };
  }

  // 1. 総支出額の計算
  const totalExpenses = expenses.reduce((sum, exp) => sum + Math.max(0, exp.amount), 0);

  // 2. 1人あたりの平均負担額（端数四捨五入）
  const perPersonAmount = Math.round(totalExpenses / participantCount);

  // 3. 各参加者の立替合計額を集計
  const paidMap = new Map<string, number>();
  normalizedParticipants.forEach((name) => paidMap.set(name.toLowerCase(), 0));

  expenses.forEach((exp) => {
    const key = exp.payer_name.trim().toLowerCase();
    const current = paidMap.get(key) || 0;
    paidMap.set(key, current + Math.max(0, exp.amount));
  });

  // 4. 各参加者の純貸借額（netBalance）を算出
  const participantBalances: ParticipantBalance[] = normalizedParticipants.map((name) => {
    const paidTotal = paidMap.get(name.toLowerCase()) || 0;
    const shareTotal = perPersonAmount;
    const netBalance = paidTotal - shareTotal;

    return {
      name,
      paidTotal,
      shareTotal,
      netBalance,
    };
  });

  // 5. 最小送金ルート導出（Greedy Debt Matching）
  // 債権者（受け取る人: netBalance > 0）
  const creditors: { name: string; remaining: number }[] = participantBalances
    .filter((b) => b.netBalance > 0)
    .map((b) => ({ name: b.name, remaining: b.netBalance }))
    .sort((a, b) => b.remaining - a.remaining);

  // 債務者（支払う人: netBalance < 0）
  const debtors: { name: string; remaining: number }[] = participantBalances
    .filter((b) => b.netBalance < 0)
    .map((b) => ({ name: b.name, remaining: Math.abs(b.netBalance) }))
    .sort((a, b) => b.remaining - a.remaining);

  const optimalTransfers: OptimalTransfer[] = [];
  let cIndex = 0;
  let dIndex = 0;

  while (cIndex < creditors.length && dIndex < debtors.length) {
    const creditor = creditors[cIndex];
    const debtor = debtors[dIndex];

    const settleAmount = Math.min(creditor.remaining, debtor.remaining);

    if (settleAmount > 0) {
      optimalTransfers.push({
        from: debtor.name,
        to: creditor.name,
        amount: settleAmount,
      });

      creditor.remaining -= settleAmount;
      debtor.remaining -= settleAmount;
    }

    if (creditor.remaining === 0) {
      cIndex++;
    }
    if (debtor.remaining === 0) {
      dIndex++;
    }
  }

  return {
    totalExpenses,
    perPersonAmount,
    participantBalances,
    optimalTransfers,
  };
}
