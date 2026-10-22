import { vi } from 'vitest';

// Mock localStorage
const store: Record<string, string> = {};

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() { return Object.keys(store).length; },
  },
  writable: true,
});

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
    convertFileSrc: (filePath: string) => filePath,
  },
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: vi.fn().mockResolvedValue({ display: 'denied' }),
    requestPermissions: vi.fn().mockResolvedValue({ display: 'denied' }),
    schedule: vi.fn().mockResolvedValue({ notifications: [] }),
    cancel: vi.fn().mockResolvedValue({}),
    createChannel: vi.fn().mockResolvedValue({}),
    getPending: vi.fn().mockResolvedValue({ notifications: [] }),
    checkExactNotificationSetting: vi.fn().mockResolvedValue({ exact_alarm: 'granted' }),
    changeExactNotificationSetting: vi.fn().mockResolvedValue({ exact_alarm: 'granted' }),
  },
}));

// Mock import.meta.env for Supabase
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');
