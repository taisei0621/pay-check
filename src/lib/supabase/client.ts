import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  rawUrl &&
    rawUrl !== '' &&
    rawUrl !== 'https://placeholder.supabase.co' &&
    rawKey &&
    rawKey !== '' &&
    rawKey !== 'placeholder-anon-key'
);

const supabaseUrl = rawUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = rawKey || 'placeholder-anon-key';

/**
 * Supabaseクライアントインスタンス
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
