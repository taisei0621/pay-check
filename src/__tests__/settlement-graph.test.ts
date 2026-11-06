import { describe, it, expect } from 'vitest';
import { calculateMultiExpenseSettlement } from '../lib/utils/settlement-graph';

describe('calculateMultiExpenseSettlement (複数立替・相殺精算アルゴリズム)', () => {
  it('4人旅行で複数人が別々に立替えた場合、最小送金回数で完全に相殺されること', () => {
    const participants = ['佐藤', '田中', '鈴木', '高橋'];
    const expenses = [
      { title: 'レンタカー代', amount: 16000, payer_name: '佐藤' },
      { title: '居酒屋代', amount: 24000, payer_name: '田中' },
      { title: 'ガソリン代', amount: 8000, payer_name: '鈴木' },
    ];

    const result = calculateMultiExpenseSettlement(participants, expenses);

    expect(result.totalExpenses).toBe(48000);
    expect(result.perPersonAmount).toBe(12000); // 48000 / 4

    // 各人の純貸借バランスの確認
    const sato = result.participantBalances.find((b) => b.name === '佐藤');
    expect(sato?.paidTotal).toBe(16000);
    expect(sato?.netBalance).toBe(4000); // +4000 受取

    const tanaka = result.participantBalances.find((b) => b.name === '田中');
    expect(tanaka?.paidTotal).toBe(24000);
    expect(tanaka?.netBalance).toBe(12000); // +12000 受取

    const suzuki = result.participantBalances.find((b) => b.name === '鈴木');
    expect(suzuki?.paidTotal).toBe(8000);
    expect(suzuki?.netBalance).toBe(-4000); // -4000 支払

    const takahashi = result.participantBalances.find((b) => b.name === '高橋');
    expect(takahashi?.paidTotal).toBe(0);
    expect(takahashi?.netBalance).toBe(-12000); // -12000 支払

    // 最小送金ルートの確認 (2回の送金で完了)
    expect(result.optimalTransfers).toHaveLength(2);

    // 高橋 -> 田中へ 12,000円
    const t1 = result.optimalTransfers.find((t) => t.from === '高橋');
    expect(t1?.to).toBe('田中');
    expect(t1?.amount).toBe(12000);

    // 鈴木 -> 佐藤へ 4,000円
    const t2 = result.optimalTransfers.find((t) => t.from === '鈴木');
    expect(t2?.to).toBe('佐藤');
    expect(t2?.amount).toBe(4000);
  });

  it('支出が空の場合、エラーにならず初期サマリーを返却すること', () => {
    const result = calculateMultiExpenseSettlement(['田中', '佐藤'], []);
    expect(result.totalExpenses).toBe(0);
    expect(result.perPersonAmount).toBe(0);
    expect(result.optimalTransfers).toHaveLength(0);
  });

  it('1人だけが全額立て替えている場合、他の全員からその立替者へ送金されること', () => {
    const participants = ['田中', '佐藤', '鈴木'];
    const expenses = [{ title: 'ランチ代', amount: 9000, payer_name: '田中' }];

    const result = calculateMultiExpenseSettlement(participants, expenses);
    expect(result.totalExpenses).toBe(9000);
    expect(result.perPersonAmount).toBe(3000);

    expect(result.optimalTransfers).toHaveLength(2);
    expect(result.optimalTransfers.every((t) => t.to === '田中' && t.amount === 3000)).toBe(true);
  });
});
