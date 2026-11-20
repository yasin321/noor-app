import { toFaDigits, toJalaliFull } from '@/lib/jalali';

export interface SpiritualCardPayload {
  badgeText: string;
  arabicText: string;
  translationFa: string;
  referenceText: string;
  primaryColor?: string;
  accentColor?: string;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const testLine = current ? `${current} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = testLine;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateAndShareSpiritualCard(
  payload: SpiritualCardPayload
): Promise<{ ok: boolean; method: 'share' | 'download' }> {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const primary = payload.primaryColor || '#10B981';
  const accent = payload.accentColor || '#F59E0B';

  // ۱. پس‌زمینه گرادینت عمیق معنوی
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#041E17');
  bgGrad.addColorStop(0.5, '#072F24');
  bgGrad.addColorStop(1, '#031510');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // ۲. هاله نوری مرکزی
  const radial = ctx.createRadialGradient(width / 2, height * 0.42, 40, width / 2, height * 0.42, 560);
  radial.addColorStop(0, 'rgba(16, 185, 129, 0.20)');
  radial.addColorStop(0.6, 'rgba(245, 158, 11, 0.06)');
  radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  // ۳. کادر طلایی اسلامی
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  ctx.lineWidth = 3;
  ctx.strokeRect(64, 64, width - 128, height - 128);

  ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(84, 84, width - 168, height - 168);

  ctx.direction = 'rtl';
  ctx.textAlign = 'center';

  // ۴. بج بالای کارت
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText(`✨ ${payload.badgeText} ✨`, width / 2, 210);

  // ۵. تاریخ شمسی روز
  ctx.fillStyle = 'rgba(209, 250, 229, 0.75)';
  ctx.font = '26px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText(toJalaliFull(new Date()), width / 2, 268);

  // ۶. متن عربی آیه / ذکر
  ctx.fillStyle = '#FEF3C7';
  ctx.font = 'bold 54px Vazirmatn, Traditional Arabic, Tahoma, sans-serif';
  const arabicLines = wrapText(ctx, payload.arabicText, width - 240);
  let y = 520;
  for (const line of arabicLines.slice(0, 7)) {
    ctx.fillText(line, width / 2, y);
    y += 96;
  }

  // خط جداکننده وسط
  y += 30;
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 180, y);
  ctx.lineTo(width / 2 + 180, y);
  ctx.stroke();

  // ۷. ترجمه فارسی
  y += 85;
  ctx.fillStyle = '#E2E8F0';
  ctx.font = '38px Vazirmatn, Tahoma, sans-serif';
  const faLines = wrapText(ctx, payload.translationFa, width - 240);
  for (const line of faLines.slice(0, 8)) {
    ctx.fillText(line, width / 2, y);
    y += 72;
  }

  // ۸. منبع / سوره
  y += 45;
  ctx.fillStyle = primary;
  ctx.font = 'bold 34px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText(`« ${toFaDigits(payload.referenceText)} »`, width / 2, Math.min(y, 1560));

  // ۹. فوتر برندینگ ارگانیک اپلیکیشن نور
  ctx.fillStyle = '#34D399';
  ctx.font = 'bold 34px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('🌿 اپلیکیشن دستیار معنوی نور', width / 2, 1735);

  ctx.fillStyle = 'rgba(209, 250, 229, 0.65)';
  ctx.font = '25px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('اوقات شرعی دقیق • اذان‌گوی هوشمند • انس با قرآن و محاسبه نفس', width / 2, 1790);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Blob creation failed'))), 'image/png', 0.95);
  });

  const fileName = `noor-story-${Date.now()}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });

  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: payload.badgeText,
      text: `${payload.arabicText}\n\n${payload.translationFa}\n(${payload.referenceText})\n🌿 دستیار معنوی نور`,
      files: [file],
    });
    return { ok: true, method: 'share' };
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return { ok: true, method: 'download' };
}
