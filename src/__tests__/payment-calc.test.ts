import { describe, it, expect } from 'vitest';
import {
  validateEventInput,
  calculatePaymentSummary,
  generateShareMessage,
} from '../lib/utils/payment-calc';
import { PaymentEntity } from '../types/database';

describe('payment-calc', () => {
  describe('validateEventInput', () => {
    it('正常な入力値（participant_names）の場合、isValidがtrueとなること', () => {
      const input = {
        title: '送別会',
        amount_per_person: 3000,
        participant_names: ['田中', '佐藤', '鈴木'],
      };

      const result = validateEventInput(input);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('正常な入力値（participant_items）の場合、isValidがtrueとなること', () => {
      const input = {
        title: '送別会',
        amount_per_person: 3000,
        participant_items: [
          { name: '田中', custom_amount: null },
          { name: '佐藤', custom_amount: 2000 },
        ],
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

    it('金額が負の数の場合、エラーを返すこと', () => {
      const input = {
        title: '飲み会',
        amount_per_person: -500,
        participant_names: ['田中'],
      };

      const result = validateEventInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.amount).toBeDefined();
    });

    it('参加者名が空または空白のみの場合、エラーを返すこと', () => {
      const input = {
        title: '打ち上げ',
        amount_per_person: 2000,
        participant_names: ['  ', ''],
      };

      const result = validateEventInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.participants).toBeDefined();
    });
  });

  describe('calculatePaymentSummary', () => {
    const mockPayments: PaymentEntity[] = [
      {
        id: 'p1',
        event_id: 'e1',
        participant_name: '田中',
        is_paid: true,
        paid_at: '2026-10-01T20:00:00Z',
        created_at: '2026-10-01T19:00:00Z',
        updated_at: '2026-10-01T20:00:00Z',
      },
      {
        id: 'p2',
        event_id: 'e1',
        participant_name: '佐藤',
        is_paid: false,
        paid_at: null,
        created_at: '2026-10-01T19:00:00Z',
        updated_at: '2026-10-01T19:00:00Z',
      },
      {
        id: 'p3',
        event_id: 'e1',
        participant_name: '鈴木',
        is_paid: true,
        paid_at: '2026-10-01T20:10:00Z',
        created_at: '2026-10-01T19:00:00Z',
        updated_at: '2026-10-01T20:10:00Z',
      },
      {
        id: 'p4',
        event_id: 'e1',
        participant_name: '高橋',
        is_paid: false,
        paid_at: null,
        created_at: '2026-10-01T19:00:00Z',
        updated_at: '2026-10-01T19:00:00Z',
      },
    ];

    it('均等金額（参加者4名、2名支払済）の集計が正しく計算されること', () => {
      const summary = calculatePaymentSummary(5000, mockPayments);

      expect(summary.totalParticipants).toBe(4);
      expect(summary.paidCount).toBe(2);
      expect(summary.unpaidCount).toBe(2);
      expect(summary.totalExpectedAmount).toBe(20000);
      expect(summary.totalCollectedAmount).toBe(10000);
      expect(summary.remainingAmount).toBe(10000);
      expect(summary.progressPercentage).toBe(50);
    });

    it('傾斜金額（個別金額指定を含む参加者）の集計が正確に計算されること', () => {
      const tieredPayments: PaymentEntity[] = [
        {
          id: 'p1',
          event_id: 'e1',
          participant_name: '一般参加A',
          custom_amount: null, // 基本金額 3000円
          is_paid: true,
          paid_at: '2026-10-16T10:00:00Z',
          created_at: '2026-10-16T09:00:00Z',
          updated_at: '2026-10-16T10:00:00Z',
        },
        {
          id: 'p2',
          event_id: 'e1',
          participant_name: '遅刻者B',
          custom_amount: 2000, // 個別設定 2000円
          is_paid: true,
          paid_at: '2026-10-16T10:00:00Z',
          created_at: '2026-10-16T09:00:00Z',
          updated_at: '2026-10-16T10:00:00Z',
        },
        {
          id: 'p3',
          event_id: 'e1',
          participant_name: '先輩C',
          custom_amount: 5000, // 個別設定 5000円
          is_paid: false,
          paid_at: null,
          created_at: '2026-10-16T09:00:00Z',
          updated_at: '2026-10-16T09:00:00Z',
        },
        {
          id: 'p4',
          event_id: 'e1',
          participant_name: '一般参加D',
          custom_amount: null, // 基本金額 3000円
          is_paid: false,
          paid_at: null,
          created_at: '2026-10-16T09:00:00Z',
          updated_at: '2026-10-16T09:00:00Z',
        },
      ];

      // 目標総額: 3000 + 2000 + 5000 + 3000 = 13000円
      // 回収済: 3000 + 2000 = 5000円
      // 未回収: 5000 + 3000 = 8000円
      // 進捗率: 5000 / 13000 = 38%
      const summary = calculatePaymentSummary(3000, tieredPayments);

      expect(summary.totalParticipants).toBe(4);
      expect(summary.paidCount).toBe(2);
      expect(summary.unpaidCount).toBe(2);
      expect(summary.totalExpectedAmount).toBe(13000);
      expect(summary.totalCollectedAmount).toBe(5000);
      expect(summary.remainingAmount).toBe(8000);
      expect(summary.progressPercentage).toBe(38);
    });

    it('参加者0名の場合、進捗率0%で正常に集計されること', () => {
      const summary = calculatePaymentSummary(5000, []);

      expect(summary.totalParticipants).toBe(0);
      expect(summary.paidCount).toBe(0);
      expect(summary.unpaidCount).toBe(0);
      expect(summary.totalExpectedAmount).toBe(0);
      expect(summary.totalCollectedAmount).toBe(0);
      expect(summary.remainingAmount).toBe(0);
      expect(summary.progressPercentage).toBe(0);
    });
  });

  describe('generateShareMessage', () => {
    it('立替者と支払い先が設定されている場合、全ての情報が含まれた案内文が生成されること', () => {
      const message = generateShareMessage({
        title: '同期飲み会',
        amount_per_person: 4500,
        payer_name: '田中',
        payment_destination: '田中のPayPayまたは現金',
        eventUrl: 'https://pay-check-phi.vercel.app/events/xyz',
      });

      expect(message).toContain('【同期飲み会の集金案内】');
      expect(message).toContain('立替者: 田中');
      expect(message).toContain('金額: 1人 4,500円');
      expect(message).toContain('集金・支払い先: 田中のPayPayまたは現金');
      expect(message).toContain('https://pay-check-phi.vercel.app/events/xyz');
    });

    it('立替者と支払い先が省略されている場合、基本情報のみの案内文が生成されること', () => {
      const message = generateShareMessage({
        title: 'フットサルコート代',
        amount_per_person: 1500,
        payer_name: null,
        payment_destination: undefined,
        eventUrl: 'https://pay-check-phi.vercel.app/events/abc',
      });

      expect(message).toContain('【フットサルコート代の集金案内】');
      expect(message).not.toContain('立替者:');
      expect(message).not.toContain('集金・支払い先:');
      expect(message).toContain('金額: 1人 1,500円');
      expect(message).toContain('https://pay-check-phi.vercel.app/events/abc');
    });
  });
});
