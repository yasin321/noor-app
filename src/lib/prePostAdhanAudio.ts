import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NoorNativeAlarmPlugin {
  scheduleNativeAlarm(opts: {
    id: number;
    triggerAtMillis: number;
    title: string;
    body: string;
    soundType?: string;
    adhanId?: string;
    audioUrl?: string;
    durationSeconds?: number;
    volumePercent?: number;
    playbackRate?: number;
  }): Promise<void>;
  cancelNativeAlarm(opts: { id: number }): Promise<void>;
}

const NoorAlarm = registerPlugin<NoorNativeAlarmPlugin>('NoorAlarm');

// نگاشت ۱۰۰٪ دقیق تمام اذکار قبل از اذان و سوره‌ها/تعقیبات پس از اذان به فایل‌های واقعی داخل public/adhans
export const PRE_POST_AUDIO_MAP: Record<string, { file: string; titleFa: string }> = {
  // اذکار و تواشیح قبل از اذان
  rabbana: { file: 'rabbana.mp3', titleFa: 'ربنای دلنشین استاد محمدرضا شجریان' },
  rabbana_shajarian: { file: 'rabbana.mp3', titleFa: 'ربنای دلنشین استاد محمدرضا شجریان' },
  nadali_alifani: { file: 'nadali_alifani.mp3', titleFa: 'دعای معنوی نادعلی (ع) با نوای علی فانی' },
  nadali: { file: 'nadali_alifani.mp3', titleFa: 'دعای معنوی نادعلی (ع) با نوای علی فانی' },
  chant_salawat: { file: 'chant_salawat.mp3', titleFa: 'صلوات و درود ملکوتی بر محمد و آل محمد (ص)' },
  salawat: { file: 'chant_salawat.mp3', titleFa: 'صلوات و درود ملکوتی بر محمد و آل محمد (ص)' },
  chant_istighfar: { file: 'chant_istighfar.mp3', titleFa: 'استغفار و نیایش سحرگاهی (أستغفر الله ربی و أتوب إلیه)' },
  istighfar: { file: 'chant_istighfar.mp3', titleFa: 'استغفار و نیایش سحرگاهی' },
  chant_aqim: { file: 'chant_aqim.mp3', titleFa: 'تواشیح «أَقِمِ الصَّلَاةَ لِذِكْرِي»' },
  aqim: { file: 'chant_aqim.mp3', titleFa: 'تواشیح «أَقِمِ الصَّلَاةَ لِذِكْرِي»' },
  chant_tasbihat: { file: 'chant_tasbihat.mp3', titleFa: 'تسبیحات اربعه و نیایش پیش از اذان' },
  tasbihat: { file: 'chant_tasbihat.mp3', titleFa: 'تسبیحات اربعه' },
  chant_rabbanaghfir: { file: 'chant_rabbanaghfir.mp3', titleFa: 'دعای قرآنی «رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ»' },
  rabbanaghfir: { file: 'chant_rabbanaghfir.mp3', titleFa: 'دعای قرآنی ربنا اغفر لی' },

  // سوره‌ها و تعقیبات پس از اذان
  post_waqiah: { file: 'post_waqiah.mp3', titleFa: 'تلاوت سوره مبارکه واقعه (وسعت رزق و برکت)' },
  waqiah: { file: 'post_waqiah.mp3', titleFa: 'تلاوت سوره مبارکه واقعه' },
  surah_waqiah: { file: 'post_waqiah.mp3', titleFa: 'تلاوت سوره مبارکه واقعه' },
  post_yasin: { file: 'post_yasin.mp3', titleFa: 'تلاوت سوره مبارکه یس (قلب قرآن)' },
  yasin: { file: 'post_yasin.mp3', titleFa: 'تلاوت سوره مبارکه یس' },
  surah_yasin: { file: 'post_yasin.mp3', titleFa: 'تلاوت سوره مبارکه یس' },
  post_rahman: { file: 'post_rahman.mp3', titleFa: 'تلاوت سوره مبارکه الرحمن (عروس قرآن)' },
  rahman: { file: 'post_rahman.mp3', titleFa: 'تلاوت سوره مبارکه الرحمن' },
  surah_rahman: { file: 'post_rahman.mp3', titleFa: 'تلاوت سوره مبارکه الرحمن' },
  post_mulk: { file: 'post_mulk.mp3', titleFa: 'تلاوت سوره مبارکه ملک (نجات‌بخش)' },
  mulk: { file: 'post_mulk.mp3', titleFa: 'تلاوت سوره مبارکه ملک' },
  surah_mulk: { file: 'post_mulk.mp3', titleFa: 'تلاوت سوره مبارکه ملک' },
  post_saffat: { file: 'post_saffat.mp3', titleFa: 'تلاوت سوره مبارکه صافات' },
  saffat: { file: 'post_saffat.mp3', titleFa: 'تلاوت سوره مبارکه صافات' },
  post_furqan: { file: 'post_furqan.mp3', titleFa: 'تلاوت آیات عبادالرحمن (سوره فرقان)' },
  furqan: { file: 'post_furqan.mp3', titleFa: 'تلاوت سوره مبارکه فرقان' },
  post_dhariyat: { file: 'post_dhariyat.mp3', titleFa: 'تلاوت آیات سوره مبارکه ذاریات' },
  dhariyat: { file: 'post_dhariyat.mp3', titleFa: 'تلاوت سوره مبارکه ذاریات' },
  post_kursi: { file: 'post_kursi.mp3', titleFa: 'تلاوت آیةالکرسی شریف و تسبیحات حضرت زهرا (س)' },
  kursi: { file: 'post_kursi.mp3', titleFa: 'تلاوت آیةالکرسی شریف' },
  ayatul_kursi: { file: 'post_kursi.mp3', titleFa: 'تلاوت آیةالکرسی شریف' },
};

export function resolvePrePostAudioFile(trackIdOrUrl: string): string {
  if (!trackIdOrUrl) return 'post_waqiah.mp3';
  const clean = trackIdOrUrl.replace(/^\/adhans\//, '').replace(/\.mp3$/, '').trim();
  if (PRE_POST_AUDIO_MAP[clean]) {
    return PRE_POST_AUDIO_MAP[clean].file;
  }
  // جستجوی فازی بر اساس کلمات کلیدی
  if (clean.includes('waq')) return 'post_waqiah.mp3';
  if (clean.includes('yas')) return 'post_yasin.mp3';
  if (clean.includes('rah')) return 'post_rahman.mp3';
  if (clean.includes('mul')) return 'post_mulk.mp3';
  if (clean.includes('saf')) return 'post_saffat.mp3';
  if (clean.includes('fur')) return 'post_furqan.mp3';
  if (clean.includes('dha')) return 'post_dhariyat.mp3';
  if (clean.includes('kur')) return 'post_kursi.mp3';
  if (clean.includes('sal')) return 'chant_salawat.mp3';
  if (clean.includes('ist')) return 'chant_istighfar.mp3';
  if (clean.includes('aqi')) return 'chant_aqim.mp3';
  if (clean.includes('tas')) return 'chant_tasbihat.mp3';
  if (clean.includes('nad')) return 'nadali_alifani.mp3';
  if (clean.includes('rab')) return 'rabbana.mp3';
  return trackIdOrUrl.endsWith('.mp3') ? clean + '.mp3' : clean + '.mp3';
}

let activeChantAudio: HTMLAudioElement | null = null;

export function stopChantOrSurahAudio(): void {
  if (activeChantAudio) {
    try {
      activeChantAudio.pause();
      activeChantAudio.currentTime = 0;
      activeChantAudio.removeAttribute('src');
    } catch {}
    activeChantAudio = null;
  }
}

// پخش کامل سوره یا ذکر تا انتها با سرعت انتخاب‌شده کاربر (1x, 1.25x, 1.5x, 2x)
export async function playFullChantOrSurahWithSpeed(
  trackIdOrUrl: string,
  speed: number = 1.0,
  onEnded?: () => void
): Promise<void> {
  stopChantOrSurahAudio();
  const fileName = resolvePrePostAudioFile(trackIdOrUrl);
  const url = `/adhans/${fileName}`;

  const audio = new Audio(url);
  const validSpeed = Number.isFinite(speed) && speed >= 0.5 && speed <= 3.0 ? speed : 1.0;
  audio.playbackRate = validSpeed;
  audio.defaultPlaybackRate = validSpeed;
  audio.preservesPitch = true;
  audio.volume = 1.0;
  activeChantAudio = audio;

  audio.onloadedmetadata = () => {
    audio.playbackRate = validSpeed;
  };
  audio.onplay = () => {
    audio.playbackRate = validSpeed;
  };
  audio.onended = () => {
    activeChantAudio = null;
    if (onEnded) onEnded();
  };
  audio.onerror = () => {
    activeChantAudio = null;
    if (onEnded) onEnded();
  };

  await audio.play().catch(() => {
    if (onEnded) onEnded();
  });
}

// کوک کردن آلارم نیتیو مخصوص اعلان قبل از اذان و بعد از اذان با صوت واقعی همان سوره/ذکر و سرعت انتخابی (بدون محدودیت زمانی!)
export async function schedulePreOrPostAdhanNativeAlarm(opts: {
  id: number;
  triggerAtMillis: number;
  title: string;
  body: string;
  trackIdOrUrl: string;
  speed: number;
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const fileName = resolvePrePostAudioFile(opts.trackIdOrUrl);
  const cleanId = fileName.replace(/\.mp3$/, '');
  const validSpeed = Number.isFinite(opts.speed) && opts.speed >= 0.5 && opts.speed <= 3.0 ? opts.speed : 1.0;

  try {
    await NoorAlarm.scheduleNativeAlarm({
      id: opts.id,
      triggerAtMillis: opts.triggerAtMillis,
      title: opts.title,
      body: opts.body,
      soundType: 'surah_chant',
      adhanId: cleanId,
      audioUrl: `/adhans/${fileName}`,
      durationSeconds: 0, // 0 یعنی پخش کامل تا انتهای سوره/ذکر بدون قطع شدن!
      volumePercent: 100,
      playbackRate: validSpeed,
    });
  } catch {}
}
