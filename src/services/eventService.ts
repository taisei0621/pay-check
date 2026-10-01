import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  CreateEventInput,
  EventEntity,
  EventWithPayments,
  PaymentEntity,
} from '@/types/database';

// ローカルストレージモック用のキー
const STORAGE_EVENTS_KEY = 'paycheck_mock_events';
const STORAGE_PAYMENTS_KEY = 'paycheck_mock_payments';

function getLocalEvents(): EventEntity[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_EVENTS_KEY);
  return raw ? (JSON.parse(raw) as EventEntity[]) : [];
}

function saveLocalEvents(events: EventEntity[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(events));
}

function getLocalPayments(): PaymentEntity[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_PAYMENTS_KEY);
  return raw ? (JSON.parse(raw) as PaymentEntity[]) : [];
}

function saveLocalPayments(payments: PaymentEntity[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(payments));
}

/**
 * イベント作成および参加者登録
 */
export async function createEventWithParticipants(
  input: CreateEventInput
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  // Supabase未設定時はローカルストレージモックで動作（リロード保持対応）
  if (!isSupabaseConfigured) {
    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newEvent: EventEntity = {
      id: eventId,
      title: input.title.trim(),
      amount_per_person: input.amount_per_person,
      created_at: now,
      updated_at: now,
    };

    const newPayments: PaymentEntity[] = input.participant_names
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
      .map((participant_name) => ({
        id: crypto.randomUUID(),
        event_id: eventId,
        participant_name,
        is_paid: false,
        paid_at: null,
        created_at: now,
        updated_at: now,
      }));

    const events = getLocalEvents();
    saveLocalEvents([...events, newEvent]);

    const payments = getLocalPayments();
    saveLocalPayments([...payments, ...newPayments]);

    return { success: true, eventId };
  }

  try {
    // 1. イベント作成
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .insert({
        title: input.title.trim(),
        amount_per_person: input.amount_per_person,
      })
      .select('id')
      .single<{ id: string }>();

    if (eventError || !eventData) {
      return { success: false, error: eventError?.message || 'イベントの作成に失敗しました' };
    }

    const eventId = eventData.id;

    // 2. 参加者登録
    const participants = input.participant_names
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
      .map((participant_name) => ({
        event_id: eventId,
        participant_name,
        is_paid: false,
      }));

    if (participants.length > 0) {
      const { error: paymentsError } = await supabase
        .from('payments')
        .insert(participants);

      if (paymentsError) {
        return {
          success: false,
          error: paymentsError.message || '参加者の登録に失敗しました',
        };
      }
    }

    return { success: true, eventId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '予期せぬエラーが発生しました';
    return { success: false, error: message };
  }
}

/**
 * イベント情報と参加者一覧の取得
 */
export async function getEventWithPayments(
  eventId: string
): Promise<{ data: EventWithPayments | null; error?: string }> {
  // Supabase未設定時はローカルストレージモックから取得
  if (!isSupabaseConfigured) {
    const events = getLocalEvents();
    const event = events.find((e) => e.id === eventId);
    if (!event) {
      return { data: null, error: 'イベントが見つかりません' };
    }
    const payments = getLocalPayments().filter((p) => p.event_id === eventId);
    return {
      data: {
        ...event,
        payments,
      },
    };
  }

  try {
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single<EventEntity>();

    if (eventError || !event) {
      return { data: null, error: eventError?.message || 'イベントが見つかりません' };
    }

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .returns<PaymentEntity[]>();

    if (paymentsError) {
      return { data: null, error: paymentsError.message || '参加者情報の取得に失敗しました' };
    }

    return {
      data: {
        ...event,
        payments: payments || [],
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '予期せぬエラーが発生しました';
    return { data: null, error: message };
  }
}

/**
 * 支払いステータスの切り替え (未払い <-> 支払い済)
 */
export async function togglePaymentStatus(
  paymentId: string,
  newStatus: boolean
): Promise<{ success: boolean; is_paid?: boolean; error?: string }> {
  // Supabase未設定時はローカルストレージモックを更新
  if (!isSupabaseConfigured) {
    const payments = getLocalPayments();
    const target = payments.find((p) => p.id === paymentId);
    if (!target) {
      return { success: false, error: '参加者データが見つかりません' };
    }

    target.is_paid = newStatus;
    target.paid_at = newStatus ? new Date().toISOString() : null;
    target.updated_at = new Date().toISOString();

    saveLocalPayments(payments);
    return { success: true, is_paid: target.is_paid };
  }

  try {
    const paid_at = newStatus ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from('payments')
      .update({
        is_paid: newStatus,
        paid_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .select('is_paid')
      .single<{ is_paid: boolean }>();

    if (error || !data) {
      return { success: false, error: error?.message || '支払いステータスの更新に失敗しました' };
    }

    return { success: true, is_paid: data.is_paid };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '予期せぬエラーが発生しました';
    return { success: false, error: message };
  }
}
