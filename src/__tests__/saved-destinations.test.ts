import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSavedDestinations,
  saveDestination,
  removeSavedDestination,
} from '../lib/utils/saved-destinations';

describe('saved-destinations (よく使う送金先のローカル記憶)', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    const storageMock = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    };

    Object.defineProperty(global, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global, 'window', {
      value: { localStorage: storageMock },
      writable: true,
      configurable: true,
    });
  });

  it('初期状態では空配列を返すこと', () => {
    expect(getSavedDestinations()).toEqual([]);
  });

  it('送金先を保存すると先頭に追加され取得できること', () => {
    saveDestination('PayPay ID: user1');
    saveDestination('三井住友銀行 渋谷支店 普通 1234567');

    const result = getSavedDestinations();
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('三井住友銀行 渋谷支店 普通 1234567');
    expect(result[1]).toBe('PayPay ID: user1');
  });

  it('重複して保存した場合は最新として先頭に並び替わること', () => {
    saveDestination('PayPay ID: user1');
    saveDestination('PayPay ID: user2');
    saveDestination('PayPay ID: user1');

    const result = getSavedDestinations();
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('PayPay ID: user1');
    expect(result[1]).toBe('PayPay ID: user2');
  });

  it('送金先を削除できること', () => {
    saveDestination('PayPay ID: user1');
    saveDestination('PayPay ID: user2');

    removeSavedDestination('PayPay ID: user1');
    expect(getSavedDestinations()).toEqual(['PayPay ID: user2']);
  });
});
