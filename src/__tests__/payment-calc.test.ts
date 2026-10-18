import { describe, it, expect } from 'vitest';
import {
  validateEventInput,
  calculatePaymentSummary,
  calculateSettlement,
  generateShareMessage,
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
});
