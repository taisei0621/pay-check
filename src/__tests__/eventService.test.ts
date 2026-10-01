import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createEventWithParticipants,
  getEventWithPayments,
  togglePaymentStatus,
} from '../services/eventService';
import { supabase } from '../lib/supabase/client';

// Supabaseクライアントのモック
vi.mock('../lib/supabase/client', () => {
  return {
    isSupabaseConfigured: true,
    supabase: {
      from: vi.fn(),
    },
  };
});

describe('eventService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEventWithParticipants', () => {
    it('イベントおよび参加者の登録が正常に完了し、eventIdを返すこと', () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'test-event-uuid' },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEventsInsert = vi.fn().mockReturnValue({ select: mockSelect });

      const mockPaymentsInsert = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'events') {
          return { insert: mockEventsInsert };
        }
        if (table === 'payments') {
          return { insert: mockPaymentsInsert };
        }
        return {};
      });

      return createEventWithParticipants({
        title: '歓迎会',
        amount_per_person: 4000,
        participant_names: ['佐藤', '田中'],
      }).then((result) => {
        expect(result.success).toBe(true);
        expect(result.eventId).toBe('test-event-uuid');
        expect(mockEventsInsert).toHaveBeenCalledWith({
          title: '歓迎会',
          amount_per_person: 4000,
        });
        expect(mockPaymentsInsert).toHaveBeenCalledWith([
          { event_id: 'test-event-uuid', participant_name: '佐藤', is_paid: false },
          { event_id: 'test-event-uuid', participant_name: '田中', is_paid: false },
        ]);
      });
    });
  });

  describe('togglePaymentStatus', () => {
    it('ステータス更新成功時に更新後のis_paidを返すこと', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { is_paid: true },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        update: mockUpdate,
      });

      const result = await togglePaymentStatus('payment-uuid-1', true);
      expect(result.success).toBe(true);
      expect(result.is_paid).toBe(true);
    });
  });
});
