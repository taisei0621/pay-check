/**
 * よく使う送金先（PayPayや銀行口座）の記憶・呼出ユーティリティ
 */

const STORAGE_SAVED_DESTINATIONS_KEY = 'paycheck_saved_destinations';
const MAX_SAVED = 5;

export function getSavedDestinations(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_DESTINATIONS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveDestination(destination: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = destination.trim();
  if (!trimmed) return;

  try {
    const existing = getSavedDestinations();
    // 既存にあれば先頭に移動、なければ先頭に追加
    const filtered = existing.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, MAX_SAVED);
    localStorage.setItem(STORAGE_SAVED_DESTINATIONS_KEY, JSON.stringify(updated));
  } catch {
    // LocalStorage write error handling
  }
}

export function removeSavedDestination(destination: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedDestinations();
    const updated = existing.filter((item) => item.toLowerCase() !== destination.toLowerCase());
    localStorage.setItem(STORAGE_SAVED_DESTINATIONS_KEY, JSON.stringify(updated));
  } catch {
    // LocalStorage error handling
  }
}
