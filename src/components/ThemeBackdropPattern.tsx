import { useState, useEffect } from 'react';

export type OccasionMotifId = 'default' | 'ramadan' | 'yalda' | 'nowruz' | 'muharram' | 'fatimiyya' | 'spring_bloom';

export interface OccasionMotifMeta {
  id: OccasionMotifId;
  titleFa: string;
  subtitleFa: string;
  quoteFa: string;
  emoji: string;
  gradient: string;
  borderColor: string;
  accentText: string;
}

const MOTIF_STORAGE_KEY = 'noor_occasion_visual_motif_v1';

export const OCCASION_MOTIFS: OccasionMotifMeta[] = [
  {
    id: 'default',
    titleFa: 'زمردی معنوی (طرح اصلی نور)',
    subtitleFa: 'محراب و شمسه اسلیمی با آرامش معنوی',
    quoteFa: 'خدایا دل ما را به نور ایمان و محبت اهل‌بیت (ع) روشن فرما',
    emoji: '🕌',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(7, 26, 22, 0.94) 100%)',
    borderColor: 'rgba(52, 211, 153, 0.38)',
    accentText: '#6EE7B7',
  },
  {
    id: 'ramadan',
    titleFa: 'ضیافت ماه مبارک رمضان',
    subtitleFa: 'فانوس‌های نورانی، هلال ماه و بهار قرآن',
    quoteFa: 'خدایا به ما توفیق بندگی عطا کن و راه درست را به ما نشان بده',
    emoji: '🌙',
    gradient: 'linear-gradient(135deg, rgba(30, 58, 138, 0.55) 0%, rgba(245, 158, 11, 0.22) 55%, rgba(11, 19, 43, 0.95) 100%)',
    borderColor: 'rgba(251, 191, 36, 0.48)',
    accentText: '#FDE68A',
  },
  {
    id: 'yalda',
    titleFa: 'شب یلدا و گرمای خانواده',
    subtitleFa: 'انار و هندوانه شب چله و صله رحم با عزیزان',
    quoteFa: 'بلندترین شب سال با عشق، صله رحم و امید سپری شود',
    emoji: '🍉',
    gradient: 'linear-gradient(135deg, rgba(225, 29, 72, 0.42) 0%, rgba(159, 18, 57, 0.28) 50%, rgba(28, 10, 16, 0.95) 100%)',
    borderColor: 'rgba(251, 113, 133, 0.48)',
    accentText: '#FDA4AF',
  },
  {
    id: 'nowruz',
    titleFa: 'عید باستانی نوروز و بهار طبیعت',
    subtitleFa: 'سبزه، تنگ ماهی، شکوفه و طراوت سال نو',
    quoteFa: 'یا مقلب القلوب و الابصار، حول حالنا الی احسن الحال',
    emoji: '🌱',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.36) 0%, rgba(250, 204, 21, 0.20) 55%, rgba(6, 30, 22, 0.94) 100%)',
    borderColor: 'rgba(110, 231, 183, 0.48)',
    accentText: '#A7F3D0',
  },
  {
    id: 'muharram',
    titleFa: 'ماه محرم الحرام و حریم حسینی',
    subtitleFa: 'بیرق سرخ یا حسین (ع) و گنبد طلایی کربلا',
    quoteFa: 'محرم، ماه عشق، آزادگی و ارادت به سیدالشهدا (ع) گرامی باد',
    emoji: '🏴',
    gradient: 'linear-gradient(135deg, rgba(185, 28, 28, 0.44) 0%, rgba(20, 6, 8, 0.96) 100%)',
    borderColor: 'rgba(248, 113, 113, 0.45)',
    accentText: '#FCA5A5',
  },
  {
    id: 'fatimiyya',
    titleFa: 'ایام فاطمیه و سوگ یاس نبوی',
    subtitleFa: 'شمع روشن و گل‌های سفید به یاد حضرت زهرا (س)',
    quoteFa: 'یا فاطمة الزهرا (س)؛ سلام الله علیها دستگیر ما در دو سرا باش',
    emoji: '🕯️',
    gradient: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.96) 100%)',
    borderColor: 'rgba(253, 224, 71, 0.38)',
    accentText: '#FEF08A',
  },
  {
    id: 'spring_bloom',
    titleFa: 'شکوفه بهاری و نسیم آرامش',
    subtitleFa: 'آلاچیق بهاری، شکوفه‌های صورتی و انرژی مثبت',
    quoteFa: 'هر روز یک قدم کوچک به سمت آرامش، شکرگزاری و رویاهایمان',
    emoji: '🌸',
    gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.32) 0%, rgba(56, 189, 248, 0.22) 55%, rgba(19, 24, 38, 0.94) 100%)',
    borderColor: 'rgba(244, 114, 182, 0.45)',
    accentText: '#FBCFE8',
  },
];

export function getSelectedOccasionMotif(): OccasionMotifMeta {
  try {
    const id = localStorage.getItem(MOTIF_STORAGE_KEY);
    const found = OCCASION_MOTIFS.find((m) => m.id === id);
    if (found) return found;
  } catch {}
  return OCCASION_MOTIFS[0];
}

export function setSelectedOccasionMotif(id: OccasionMotifId): void {
  try {
    localStorage.setItem(MOTIF_STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent('noor-motif-changed'));
  } catch {}
}

export function ThemeBackdropPattern({ motifId }: { motifId: OccasionMotifId }) {
  if (motifId === 'ramadan') {
    return (
      <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-35" viewBox="0 0 400 130" fill="none">
        <path d="M335 16C323 16 314 25 314 37C314 49 323 58 335 58C328 53 324 45 324 37C324 29 328 21 335 16Z" fill="#FDE047" />
        <line x1="60" y1="0" x2="60" y2="32" stroke="#FBBF24" strokeWidth="1.5" />
        <polygon points="60,32 70,48 60,64 50,48" fill="#F59E0B" fillOpacity="0.65" stroke="#FEF08A" strokeWidth="1" />
        <line x1="110" y1="0" x2="110" y2="20" stroke="#FBBF24" strokeWidth="1.5" />
        <polygon points="110,20 118,34 110,46 102,34" fill="#38BDF8" fillOpacity="0.55" stroke="#BAE6FD" strokeWidth="1" />
        <circle cx="210" cy="24" r="1.8" fill="#FEF08A" />
        <circle cx="260" cy="42" r="1.5" fill="#FEF08A" />
      </svg>
    );
  }
  if (motifId === 'yalda') {
    return (
      <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-35" viewBox="0 0 400 130" fill="none">
        <circle cx="65" cy="65" r="26" fill="#E11D48" />
        <polygon points="60,39 65,31 70,39" fill="#FB7185" />
        <circle cx="60" cy="62" r="3" fill="#FFF1F2" fillOpacity="0.6" />
        <circle cx="69" cy="68" r="2.5" fill="#FFF1F2" fillOpacity="0.6" />
        <path d="M110 85 A32 32 0 0 0 174 85 Z" fill="#10B981" />
        <path d="M115 85 A27 27 0 0 0 169 85 Z" fill="#F43F5E" />
      </svg>
    );
  }
  if (motifId === 'nowruz' || motifId === 'spring_bloom') {
    return (
      <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-35" viewBox="0 0 400 130" fill="none">
        <circle cx="55" cy="38" r="9" fill="#F472B6" fillOpacity="0.7" />
        <circle cx="55" cy="38" r="3.5" fill="#FEF08A" />
        <circle cx="95" cy="22" r="7" fill="#FB7185" fillOpacity="0.65" />
        <circle cx="95" cy="22" r="2.5" fill="#FEF08A" />
        <circle cx="330" cy="75" r="22" fill="#38BDF8" fillOpacity="0.25" stroke="#BAE6FD" strokeWidth="1.5" />
        <ellipse cx="330" cy="75" rx="8" ry="4" fill="#FB923C" />
      </svg>
    );
  }
  if (motifId === 'muharram') {
    return (
      <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-35" viewBox="0 0 400 130" fill="none">
        <line x1="75" y1="12" x2="75" y2="115" stroke="#FBBF24" strokeWidth="2.5" />
        <path d="M75 18 C110 12 135 32 165 22 L165 56 C135 66 110 46 75 52 Z" fill="#DC2626" />
      </svg>
    );
  }
  if (motifId === 'fatimiyya') {
    return (
      <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-35" viewBox="0 0 400 130" fill="none">
        <rect x="58" y="52" width="16" height="52" rx="4" fill="#E2E8F0" />
        <path d="M66 28 C60 38 60 46 66 50 C72 46 72 38 66 28 Z" fill="#FDE047" />
        <circle cx="66" cy="40" r="16" fill="#FDE047" fillOpacity="0.22" />
      </svg>
    );
  }
  return null;
}

export function OccasionVisualBanner({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const [motif, setMotif] = useState<OccasionMotifMeta>(() => getSelectedOccasionMotif());

  useEffect(() => {
    const onUpdate = () => setMotif(getSelectedOccasionMotif());
    window.addEventListener('noor-motif-changed', onUpdate);
    return () => window.removeEventListener('noor-motif-changed', onUpdate);
  }, []);

  return (
    <div
      className="relative rounded-3xl p-3.5 mb-3 border overflow-hidden shadow-lg"
      style={{ background: motif.gradient, borderColor: motif.borderColor }}
      dir="rtl"
    >
      <ThemeBackdropPattern motifId={motif.id} />
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{motif.emoji}</span>
            <h2 className="text-xs font-black text-white truncate">{motif.titleFa}</h2>
          </div>
          <p className="text-[11px] font-bold mt-0.5 truncate" style={{ color: motif.accentText }}>
            {motif.subtitleFa}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const idx = OCCASION_MOTIFS.findIndex((m) => m.id === motif.id);
            const next = OCCASION_MOTIFS[(idx + 1) % OCCASION_MOTIFS.length];
            setSelectedOccasionMotif(next.id);
          }}
          onDoubleClick={onOpenSettings}
          className="px-2.5 py-1.5 rounded-xl text-[10px] font-black shrink-0 border shadow-sm transition-transform active:scale-95"
          style={{ background: 'rgba(0,0,0,0.38)', color: '#FEF08A', borderColor: 'rgba(251,191,36,0.38)' }}
          title="با هر لمس، طرح مناسبتی (رمضان، یلدا، نوروز، محرم، فاطمیه، بهار) عوض می‌شود"
        >
          طرح مناسبتی 🎨
        </button>
      </div>
      <p className="relative z-10 text-[10px] text-white/85 mt-1.5 pt-1.5 border-t border-white/10">
        ✨ «{motif.quoteFa}»
      </p>
    </div>
  );
}
