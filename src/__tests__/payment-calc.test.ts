import { describe, it, expect } from 'vitest';
import {
  validateEventInput,
  calculatePaymentSummary,
  calculateSettlement,
  generateShareMessage,
  roundAmount,
  detectPaymentType,
} from '../lib/utils/payment-calc';
import { PaymentEntity } from '../types/database';

describe('payment-calc', () => {
  describe('calculateSettlement (誰が誰にいくら払うか)', () => {
    const mockPayments: PaymentEntity[] = [
      {
        id: 'p1',
        event_id: 'e1',
        participant_name: '田中', // 立替者
        is_paid: false,
        paid_at: null,
        created_at: '2026-10-16T10:00:00Z',
        updated_at: '2026-10-16T10:00:00Z',
      },
      {
        id: 'p2',
        event_id: 'e1',
        participant_name: '佐藤',
        is_paid: true, // 支払済
        paid_at: '2026-10-16T11:00:00Z',
        created_at: '2026-10-16T10:00:00Z',
        updated_at: '2026-10-16T11:00:00Z',
      },
      {
        id: 'p3',
        event_id: 'e1',
        participant_name: '鈴木',
        is_paid: false, // 未払い
        paid_at: null,
        created_at: '2026-10-16T10:00:00Z',
        updated_at: '2026-10-16T10:00:00Z',
      },
      {
        id: 'p4',
        event_id: 'e1',
        participant_name: '高橋',
        is_paid: false, // 未払い
        paid_at: null,
        created_at: '2026-10-16T10:00:00Z',
        updated_at: '2026-10-16T10:00:00Z',
      },
    ];

    it('立替総額12,000円、参加者4名、立替者が田中の場合、田中を除く3名から計9,000円を回収する計算になること', () => {
      const settlement = calculateSettlement(
        {
          total_amount: 12000,
          amount_per_person: 0,
          payer_name: '田中',
        },
        mockPayments
      );

      expect(settlement.totalAmount).toBe(12000);
      expect(settlement.payerName).toBe('田中');
      expect(settlement.perPersonAmount).toBe(3000); // 12000 / 4

      // 回収対象は立替者田中を除く3名
      expect(settlement.collectTargetCount).toBe(3);
      expect(settlement.collectTargetAmount).toBe(9000); // 3000 * 3
      expect(settlement.paidCount).toBe(1); // 佐藤のみ
      expect(settlement.remainingCount).toBe(2); // 鈴木、高橋
      expect(settlement.collectedAmount).toBe(3000);
      expect(settlement.remainingAmount).toBe(6000);
      expect(settlement.progressPercentage).toBe(33); // 3000 / 9000

      // 送金指示の確認
      const tanakaTransfer = settlement.transfers.find((t) => t.fromName === '田中');
      expect(tanakaTransfer?.isPayer).toBe(true);

      const satoTransfer = settlement.transfers.find((t) => t.fromName === '佐藤');
      expect(satoTransfer?.toName).toBe('田中');
      expect(satoTransfer?.amount).toBe(3000);
      expect(satoTransfer?.is_paid).toBe(true);

      const suzukiTransfer = settlement.transfers.find((t) => t.fromName === '鈴木');
      expect(suzukiTransfer?.toName).toBe('田中');
      expect(suzukiTransfer?.amount).toBe(3000);
      expect(suzukiTransfer?.is_paid).toBe(false);
    });

    it('傾斜金額が設定されている場合、個別金額が優先されて正確に集計されること', () => {
      const tieredPayments: PaymentEntity[] = [
        {
          id: 'p1',
          event_id: 'e1',
          participant_name: '田中', // 立替者
          custom_amount: null,
          is_paid: false,
          paid_at: null,
          created_at: '2026-10-16T10:00:00Z',
          updated_at: '2026-10-16T10:00:00Z',
        },
        {
          id: 'p2',
          event_id: 'e1',
          participant_name: '佐藤', // 個別 2000円
          custom_amount: 2000,
          is_paid: true,
          paid_at: '2026-10-16T11:00:00Z',
          created_at: '2026-10-16T10:00:00Z',
          updated_at: '2026-10-16T11:00:00Z',
        },
      ];

      const settlement = calculateSettlement(
        {
          total_amount: null,
          amount_per_person: 4000,
          payer_name: '田中',
        },
        tieredPayments
      );

      // 佐藤は 2,000円で支払済
      const sato = settlement.transfers.find((t) => t.fromName === '佐藤');
      expect(sato?.amount).toBe(2000);
      expect(settlement.collectTargetAmount).toBe(2000);
      expect(settlement.collectedAmount).toBe(2000);
      expect(settlement.remainingAmount).toBe(0);
      expect(settlement.progressPercentage).toBe(100);
    });
  });

  describe('validateEventInput', () => {
    it('正常な入力値の場合、isValidがtrueとなること', () => {
      const input = {
        title: '送別会',
        amount_per_person: 3000,
        participant_names: ['田中', '佐藤', '鈴木'],
      };

      const result = validateEventInput(input);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('イベント名が空の場合、エラーを返すこと', () => {
      const input = {
        title: '   ',
        amount_per_person: 3000,
        participant_names: ['田中'],
      };

      const result = validateEventInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBeDefined();
    });
  });

  describe('generateShareMessage', () => {
    it('立替者と支払い先、立替総額が含まれた案内文が生成されること', () => {
      const message = generateShareMessage({
        title: '同期飲み会',
        total_amount: 12000,
        amount_per_person: 3000,
        payer_name: '田中',
        payment_destination: 'PayPay ID: tanaka',
        eventUrl: 'https://pay-check-phi.vercel.app/events/xyz',
      });

      expect(message).toContain('【同期飲み会の集金案内】');
      expect(message).toContain('立替者: 田中');
      expect(message).toContain('立替総額: 12,000円');
      expect(message).toContain('1人あたりの金額: 3,000円');
      expect(message).toContain('集金先: PayPay ID: tanaka');
      expect(message).toContain('https://pay-check-phi.vercel.app/events/xyz');
    });
  });

  describe('roundAmount', () => {
    it('100円単位の切り上げ、切り捨て、四捨五入が正しく動作すること', () => {
      expect(roundAmount(3333, 100, 'ceil')).toBe(3400);
      expect(roundAmount(3333, 100, 'floor')).toBe(3300);
      expect(roundAmount(3333, 100, 'round')).toBe(3300);
      expect(roundAmount(3360, 100, 'round')).toBe(3400);
    });

    it('500円単位の切り上げ、切り捨てが正しく動作すること', () => {
      expect(roundAmount(3333, 500, 'ceil')).toBe(3500);
      expect(roundAmount(3333, 500, 'floor')).toBe(3000);
    });
  });

  describe('端数丸め設定を伴う calculateSettlement', () => {
    const threePayments: PaymentEntity[] = [
      {
        id: 'p1',
        event_id: 'e1',
        participant_name: '田中', // 立替者
        is_paid: false,
        paid_at: null,
        created_at: '2026-10-25T10:00:00Z',
        updated_at: '2026-10-25T10:00:00Z',
      },
      {
        id: 'p2',
        event_id: 'e1',
        participant_name: '佐藤',
        is_paid: false,
        paid_at: null,
        created_at: '2026-10-25T10:00:00Z',
        updated_at: '2026-10-25T10:00:00Z',
      },
      {
        id: 'p3',
        event_id: 'e1',
        participant_name: '鈴木',
        is_paid: false,
        paid_at: null,
        created_at: '2026-10-25T10:00:00Z',
        updated_at: '2026-10-25T10:00:00Z',
      },
    ];

    it('10,000円で3名、100円切り上げの場合、1人3,400円となり差額+200円が算出されること', () => {
      const settlement = calculateSettlement(
        {
          total_amount: 10000,
          amount_per_person: 0,
          payer_name: '田中',
        },
        threePayments,
        { unit: 100, method: 'ceil' }
      );

      expect(settlement.perPersonAmount).toBe(3400);
      expect(settlement.collectTargetAmount).toBe(6800); // 3400 * 2人
      expect(settlement.payerDiff).toBe(200); // 3400 * 3人 - 10000 = +200
    });

    it('10,000円で3名、100円切り捨ての場合、1人3,300円となり差額-100円が算出されること', () => {
      const settlement = calculateSettlement(
        {
          total_amount: 10000,
          amount_per_person: 0,
          payer_name: '田中',
        },
        threePayments,
        { unit: 100, method: 'floor' }
      );

      expect(settlement.perPersonAmount).toBe(3300);
      expect(settlement.collectTargetAmount).toBe(6600); // 3300 * 2人
      expect(settlement.payerDiff).toBe(-100); // 3300 * 3人 - 10000 = -100
    });
  });

  describe('detectPaymentType', () => {
    it('PayPayリンクURLを正しく検出すること', () => {
      const res = detectPaymentType('https://paypay.me/myqr/sample123');
      expect(res.type).toBe('paypay_link');
      expect(res.actionUrl).toBe('https://paypay.me/myqr/sample123');
      expect(res.copyValue).toBe('https://paypay.me/myqr/sample123');
    });

    it('PayPay ID文字列を正しく検出すること', () => {
      const res = detectPaymentType('PayPay ID: tanaka1234');
      expect(res.type).toBe('paypay_id');
      expect(res.actionUrl).toBeNull();
      expect(res.copyValue).toBe('tanaka1234');
    });

    it('銀行口座情報を正しく検出すること', () => {
      const res = detectPaymentType('三井住友銀行 渋谷支店 普通 1234567');
      expect(res.type).toBe('bank');
      expect(res.copyValue).toBe('三井住友銀行 渋谷支店 普通 1234567');
    });

    it('手渡しなどの一般的なテキストを正しく判定すること', () => {
      const res = detectPaymentType('当日現金手渡し');
      expect(res.type).toBe('other');
      expect(res.copyValue).toBe('当日現金手渡し');
    });
  });
});
