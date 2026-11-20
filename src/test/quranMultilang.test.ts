import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getQuranEditionForLang, fetchSurahAyahs } from '@/lib/quranCatalog';
import { getLocalizedInboxMessage, type InboxMessage } from '@/lib/inboxService';

describe('Multilingual Quran Translation Loader (FA / EN / ES)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('selects authentic translation editions for fa, en, and es', () => {
    expect(getQuranEditionForLang('fa').code).toBe('fa.fooladvand');
    expect(getQuranEditionForLang('en').code).toBe('en.sahih');
    expect(getQuranEditionForLang('es').code).toBe('es.cortes');
  });

  it('loads bundled Persian surahs immediately with zero network calls', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const ayahs = await fetchSurahAyahs(112, undefined, 'fa');
    expect(ayahs.length).toBe(4);
    expect(ayahs[0].arabic).toContain('أَحَدٌ');
    expect(ayahs[0].translation).toContain('یکتا');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches, merges with bundled Arabic, and caches English & Spanish translations offline', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('en.sahih')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              ayahs: [
                { text: 'Say, "He is Allah, [who is] One,' },
                { text: 'Allah, the Eternal Refuge.' },
                { text: 'He neither begets nor is born,' },
                { text: 'Nor is there to Him any equivalent."' },
              ],
            },
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          data: {
            ayahs: [
              { text: 'Di: «Él es Alá, Uno,' },
              { text: 'Alá, el Eterno.' },
              { text: 'No ha engendrado, ni ha sido engendrado.' },
              { text: 'No tiene par».' },
            ],
          },
        }),
      } as Response;
    });

    const enAyahs = await fetchSurahAyahs(112, undefined, 'en');
    expect(enAyahs.length).toBe(4);
    expect(enAyahs[0].arabic).toContain('أَحَدٌ');
    expect(enAyahs[0].translation).toContain('One');
    expect(localStorage.getItem('noor_surah_cache_v2_en_112')).toBeTruthy();

    // دومین بار باید مستقیم از کش آفلاین بخواند (بدون fetch)
    const callCountAfterEn = fetchSpy.mock.calls.length;
    const enCached = await fetchSurahAyahs(112, undefined, 'en');
    expect(enCached[1].translation).toContain('Eternal');
    expect(fetchSpy.mock.calls.length).toBe(callCountAfterEn);

    const esAyahs = await fetchSurahAyahs(112, undefined, 'es');
    expect(esAyahs[0].translation).toContain('Uno');
    expect(localStorage.getItem('noor_surah_cache_v2_es_112')).toBeTruthy();
  });

  it('falls back cleanly to bundled Arabic with localized notice when offline', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));
    const enOffline = await fetchSurahAyahs(112, undefined, 'en');
    expect(enOffline.length).toBe(4);
    expect(enOffline[0].arabic).toContain('أَحَدٌ');
    expect(enOffline[0].translation).toContain('Saheeh International');
  });

  it('localizes OTA inbox messages with graceful fallback to Persian', () => {
    const msg: InboxMessage = {
      id: 'm1',
      title_fa: 'نسخه جدید',
      title_en: 'New Release',
      title_es: 'Nueva versión',
      body_fa: 'متن فارسی',
      body_en: 'English body',
      body_es: null,
      category: 'update',
      priority: 'normal',
      show_popup: true,
      action_label_fa: 'دانلود',
      action_label_en: 'Download',
      action_label_es: 'Descargar',
      action_target: 'sync_hub',
      created_at: new Date().toISOString(),
    };
    expect(getLocalizedInboxMessage(msg, 'fa').title).toBe('نسخه جدید');
    expect(getLocalizedInboxMessage(msg, 'en').title).toBe('New Release');
    expect(getLocalizedInboxMessage(msg, 'es').title).toBe('Nueva versión');
    expect(getLocalizedInboxMessage(msg, 'es').body).toBe('English body');
  });
});
