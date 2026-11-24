export type StoreChannel = 'bazaar' | 'myket' | 'direct';

export const NOOR_APPLICATION_ID = 'ir.noorcompanion.app';
export const NOOR_SUPPORT_EMAIL = 'ycnakbari@gmail.com';
export const NOOR_SUPPORT_TELEGRAM_HANDLE = '@ak_yacn';
export const NOOR_SUPPORT_TELEGRAM_URL = 'https://t.me/ak_yacn';
export const NOOR_PRIVACY_POLICY_URL = 'https://yasin321.github.io/noor-app/privacy.html';

export function resolveStoreChannel(raw?: string | null): StoreChannel {
  const v = String(raw || '').trim().toLowerCase();
  if (v === 'bazaar' || v === 'cafebazaar') return 'bazaar';
  if (v === 'myket') return 'myket';
  return 'direct';
}

export function getStoreChannel(): StoreChannel {
  const envVal = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env?.VITE_STORE_CHANNEL;
  return resolveStoreChannel(envVal);
}

export function isMarketChannel(channel: StoreChannel = getStoreChannel()): boolean {
  return channel === 'bazaar' || channel === 'myket';
}

export function getStoreListingUrl(channel: StoreChannel = getStoreChannel()): string {
  if (channel === 'bazaar') return 'https://cafebazaar.ir/app/' + NOOR_APPLICATION_ID;
  if (channel === 'myket') return 'https://myket.ir/app/' + NOOR_APPLICATION_ID;
  return 'https://github.com/yasin321/noor-app/releases/latest';
}

export function resolveStoreUpdateLink(
  directApkUrl: string,
  channel: StoreChannel = getStoreChannel()
): string {
  if (isMarketChannel(channel)) {
    return getStoreListingUrl(channel);
  }
  return directApkUrl || getStoreListingUrl('direct');
}
