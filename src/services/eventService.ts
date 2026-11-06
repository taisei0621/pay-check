import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  CreateEventInput,
  EventEntity,
  EventWithPayments,
  PaymentEntity,
  ExpenseEntity,
  EventPhotoEntity,
} from '@/types/database';

// ローカルストレージモック用のキー
const STORAGE_EVENTS_KEY = 'paycheck_mock_events';
const STORAGE_PAYMENTS_KEY = 'paycheck_mock_payments';
const STORAGE_EXPENSES_KEY = 'paycheck_mock_expenses';
const STORAGE_PHOTOS_KEY = 'paycheck_mock_photos';

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

function getLocalExpenses(): ExpenseEntity[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_EXPENSES_KEY);
  return raw ? (JSON.parse(raw) as ExpenseEntity[]) : [];
}

function saveLocalExpenses(expenses: ExpenseEntity[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_EXPENSES_KEY, JSON.stringify(expenses));
}

function getLocalPhotos(): EventPhotoEntity[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_PHOTOS_KEY);
  return raw ? (JSON.parse(raw) as EventPhotoEntity[]) : [];
}

function saveLocalPhotos(photos: EventPhotoEntity[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_PHOTOS_KEY, JSON.stringify(photos));
}

/**
 * ローカルストレージでのイベント作成フォールバック
 */
function createLocalEvent(
  input: CreateEventInput,
  participantList: { name: string; custom_amount: number | null }[],
  payerName: string | null,
  paymentDestination: string | null,
  receiptImage: string | null
): { success: boolean; eventId: string } {
  const eventId = crypto.randomUUID();
  const now = new Date().toISOString();

  const newEvent: EventEntity = {
    id: eventId,
    title: input.title.trim(),
    total_amount: input.total_amount ?? null,
    amount_per_person: input.amount_per_person,
    payer_name: payerName,
    payment_destination: paymentDestination,
    receipt_image: receiptImage,
    created_at: now,
    updated_at: now,
  };

  const newPayments: PaymentEntity[] = participantList.map((p) => ({
    id: crypto.randomUUID(),
    event_id: eventId,
    participant_name: p.name,
    custom_amount: p.custom_amount,
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

/**
 * イベント作成および参加者登録
 */
export async function createEventWithParticipants(
  input: CreateEventInput
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const payerName = input.payer_name?.trim() || null;
  const paymentDestination = input.payment_destination?.trim() || null;
  const receiptImage = input.receipt_image || null;

  // participant_items または participant_names から正規化
  const participantList: { name: string; custom_amount: number | null }[] = input.participant_items
    ? input.participant_items
        .map((item) => ({
          name: item.name.trim(),
          custom_amount:
            typeof item.custom_amount === 'number' && item.custom_amount >= 0
              ? item.custom_amount
              : null,
        }))
        .filter((item) => item.name.length > 0)
    : (input.participant_names || [])
        .map((name) => ({ name: name.trim(), custom_amount: null }))
        .filter((item) => item.name.length > 0);

  // Supabase未設定時は直接ローカルストレージに保存
  if (!isSupabaseConfigured) {
    return createLocalEvent(
      input,
      participantList,
      payerName,
      paymentDestination,
      receiptImage
    );
  }

  try {
    // 1. イベント作成
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .insert({
        title: input.title.trim(),
        total_amount: input.total_amount ?? null,
        amount_per_person: input.amount_per_person,
        payer_name: payerName,
        payment_destination: paymentDestination,
        receipt_image: receiptImage,
      })
      .select('id')
      .single<{ id: string }>();

    if (eventError || !eventData) {
      // Supabase通信エラー時はローカルストレージへ安全にフォールバック
      return createLocalEvent(
        input,
        participantList,
        payerName,
        paymentDestination,
        receiptImage
      );
    }

    const eventId = eventData.id;

    // 2. 参加者登録
    const participants = participantList.map((p) => ({
      event_id: eventId,
      participant_name: p.name,
      custom_amount: p.custom_amount,
      is_paid: false,
    }));

    if (participants.length > 0) {
      const { error: paymentsError } = await supabase
        .from('payments')
        .insert(participants);

      if (paymentsError) {
        // 部分フォールバック
        return createLocalEvent(
          input,
          participantList,
          payerName,
          paymentDestination,
          receiptImage
        );
      }
    }

    return { success: true, eventId };
  } catch {
    // ネットワーク障害やDNS解決不能などの例外時も確実にフォールバック
    return createLocalEvent(
      input,
      participantList,
      payerName,
      paymentDestination,
      receiptImage
    );
  }
}

/**
 * イベント情報と参加者一覧、立替一覧、写真一覧の取得
 */
export async function getEventWithPayments(
  eventId: string
): Promise<{ data: EventWithPayments | null; error?: string }> {
  const getFromLocal = (): EventWithPayments | null => {
    const events = getLocalEvents();
    const event = events.find((e) => e.id === eventId);
    if (!event) return null;
    const payments = getLocalPayments().filter((p) => p.event_id === eventId);
    const expenses = getLocalExpenses().filter((e) => e.event_id === eventId);
    const photos = getLocalPhotos().filter((ph) => ph.event_id === eventId);

    return {
      ...event,
      payments,
      expenses,
      photos,
    };
  };

  // Supabase未設定時はローカルストレージから取得
  if (!isSupabaseConfigured) {
    const localData = getFromLocal();
    if (!localData) {
      return { data: null, error: 'イベントが見つかりません' };
    }
    return { data: localData };
  }

  try {
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single<EventEntity>();

    if (eventError || !event) {
      const localData = getFromLocal();
      if (localData) return { data: localData };
      return { data: null, error: eventError?.message || 'イベントが見つかりません' };
    }

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .returns<PaymentEntity[]>();

    if (paymentsError) {
      const localData = getFromLocal();
      if (localData) return { data: localData };
      return { data: null, error: paymentsError.message || '参加者情報の取得に失敗しました' };
    }

    // 支出一覧の取得
    let expenses: ExpenseEntity[] = [];
    try {
      const { data: expData } = await supabase
        .from('expenses')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .returns<ExpenseEntity[]>();
      if (expData) {
        expenses = expData;
      } else {
        expenses = getLocalExpenses().filter((e) => e.event_id === eventId);
      }
    } catch {
      expenses = getLocalExpenses().filter((e) => e.event_id === eventId);
    }

    // 写真一覧の取得
    let photos: EventPhotoEntity[] = [];
    try {
      const { data: photoData } = await supabase
        .from('event_photos')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .returns<EventPhotoEntity[]>();
      if (photoData) {
        photos = photoData;
      } else {
        photos = getLocalPhotos().filter((ph) => ph.event_id === eventId);
      }
    } catch {
      photos = getLocalPhotos().filter((ph) => ph.event_id === eventId);
    }

    return {
      data: {
        ...event,
        payments: payments || [],
        expenses,
        photos,
      },
    };
  } catch {
    const localData = getFromLocal();
    if (localData) return { data: localData };
    return { data: null, error: 'イベントデータの取得に失敗しました' };
  }
}

/**
 * 支払いステータスの切り替え
 */
export async function togglePaymentStatus(
  paymentId: string,
  newStatus: boolean
): Promise<{ success: boolean; is_paid?: boolean; error?: string }> {
  // 常にローカルストレージも同期更新
  const payments = getLocalPayments();
  const target = payments.find((p) => p.id === paymentId);
  if (target) {
    target.is_paid = newStatus;
    target.paid_at = newStatus ? new Date().toISOString() : null;
    target.updated_at = new Date().toISOString();
    saveLocalPayments(payments);
  }

  if (!isSupabaseConfigured) {
    return { success: true, is_paid: newStatus };
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
      // DB更新失敗でもローカルは更新済み
      return { success: true, is_paid: newStatus };
    }

    return { success: true, is_paid: data.is_paid };
  } catch {
    return { success: true, is_paid: newStatus };
  }
}

/**
 * 複数立替支出（旅行モード）の追加
 */
export async function addExpense(
  eventId: string,
  expense: {
    title: string;
    amount: number;
    payer_name: string;
    receipt_image?: string | null;
  }
): Promise<{ success: boolean; data?: ExpenseEntity; error?: string }> {
  const item: ExpenseEntity = {
    id: crypto.randomUUID(),
    event_id: eventId,
    title: expense.title.trim(),
    amount: expense.amount,
    payer_name: expense.payer_name.trim(),
    receipt_image: expense.receipt_image || null,
    created_at: new Date().toISOString(),
  };

  // 常にローカルストレージへ保存
  const list = getLocalExpenses();
  saveLocalExpenses([...list, item]);

  if (!isSupabaseConfigured) {
    return { success: true, data: item };
  }

  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        event_id: eventId,
        title: item.title,
        amount: item.amount,
        payer_name: item.payer_name,
        receipt_image: item.receipt_image,
      })
      .select('*')
      .single<ExpenseEntity>();

    if (error || !data) {
      return { success: true, data: item };
    }

    return { success: true, data };
  } catch {
    return { success: true, data: item };
  }
}

/**
 * 複数立替支出の削除
 */
export async function deleteExpense(
  expenseId: string
): Promise<{ success: boolean; error?: string }> {
  const list = getLocalExpenses().filter((e) => e.id !== expenseId);
  saveLocalExpenses(list);

  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    await supabase.from('expenses').delete().eq('id', expenseId);
    return { success: true };
  } catch {
    return { success: true };
  }
}

/**
 * 思い出写真の追加
 */
export async function addEventPhoto(
  eventId: string,
  photo: {
    image_data: string;
    caption?: string | null;
    uploader_name?: string | null;
  }
): Promise<{ success: boolean; data?: EventPhotoEntity; error?: string }> {
  const item: EventPhotoEntity = {
    id: crypto.randomUUID(),
    event_id: eventId,
    image_data: photo.image_data,
    caption: photo.caption?.trim() || null,
    uploader_name: photo.uploader_name?.trim() || null,
    created_at: new Date().toISOString(),
  };

  const list = getLocalPhotos();
  saveLocalPhotos([...list, item]);

  if (!isSupabaseConfigured) {
    return { success: true, data: item };
  }

  try {
    const { data, error } = await supabase
      .from('event_photos')
      .insert({
        event_id: eventId,
        image_data: item.image_data,
        caption: item.caption,
        uploader_name: item.uploader_name,
      })
      .select('*')
      .single<EventPhotoEntity>();

    if (error || !data) {
      return { success: true, data: item };
    }

    return { success: true, data };
  } catch {
    return { success: true, data: item };
  }
}

/**
 * 思い出写真の削除
 */
export async function deleteEventPhoto(
  photoId: string
): Promise<{ success: boolean; error?: string }> {
  const list = getLocalPhotos().filter((p) => p.id !== photoId);
  saveLocalPhotos(list);

  if (!isSupabaseConfigured) {
    return { success: true };
  }

  try {
    await supabase.from('event_photos').delete().eq('id', photoId);
    return { success: true };
  } catch {
    return { success: true };
  }
}
