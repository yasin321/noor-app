import React, { useEffect, useState } from 'react';
import {
  loadHeroConfig,
  resolveActiveHeroDesign,
  RenderHeroArtworkScene,
} from '@/components/HeroHorizon30Gallery';

export function ThemePatternWatermark({
  themeId,
  className = '',
}: {
  themeId?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`absolute inset-0 w-full h-full pointer-events-none select-none ${className}`}
      preserveAspectRatio="xMidYMid slice"
      data-theme-id={themeId || 'default'}
    >
      <defs>
        <pattern id="noor_islamic_star_grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path
            d="M25 2 L31 19 L48 25 L31 31 L25 48 L19 31 L2 25 L19 19 Z"
            fill="none"
            stroke="rgba(251, 191, 36, 0.08)"
            strokeWidth="0.8"
          />
          <circle cx="25" cy="25" r="4" fill="none" stroke="rgba(52, 211, 153, 0.08)" strokeWidth="0.7" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#noor_islamic_star_grid)" />
    </svg>
  );
}

export function NastaliqMahdiCrown({
  className = '',
  onOpenGuide,
}: {
  className?: string;
  onOpenGuide?: () => void;
}) {
  return (
    <div
      onClick={onOpenGuide}
      className={`text-center font-black tracking-wide select-none ${onOpenGuide ? 'cursor-pointer' : ''} ${className}`}
      style={{ color: '#FEF08A' }}
    >
      اللّهُمَّ صَلِّ عَلَى عَلِيِّ بْنِ مُوسَى الرَّضَا الْمُرْتَضَى
    </div>
  );
}

export function VerticalJalaliDayCounterCard({
  className = '',
  now = new Date(),
  weekdayFa = 'یکشنبه',
  onClick,
}: {
  className?: string;
  now?: Date;
  weekdayFa?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-between p-3.5 rounded-3xl border select-none text-center shadow-lg ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''} ${className}`}
      style={{
        background: 'linear-gradient(165deg, rgba(8, 35, 28, 0.94) 0%, rgba(4, 18, 14, 0.98) 100%)',
        borderColor: 'rgba(251, 191, 36, 0.38)',
        minWidth: '110px',
      }}
    >
      <div className="w-8 h-8 rounded-2xl flex items-center justify-center border mb-1" style={{ background: 'rgba(251, 191, 36, 0.15)', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
        <span className="text-amber-300 text-xs">📅</span>
      </div>
      <span className="text-xs text-amber-200 font-black">{weekdayFa}</span>
      <span className="text-3xl font-black text-amber-300 my-0.5 tracking-tight">۲۴</span>
      <span className="text-[11px] text-emerald-100/80 font-bold">آبان ۱۴۰۵</span>
      <div className="w-full border-t my-1.5" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <div className="text-[10px] text-emerald-300 font-bold">روز ۲۴۰ سال</div>
    </div>
  );
}

export function CelestialPrayerArcGauge({
  progressPercent,
  remainingText,
  nextPrayerName,
  nextPrayerTime,
  accentColor = '#FBBF24',
  primaryColor = '#10B981',
}: {
  progressPercent: number;
  remainingText: string;
  nextPrayerName: string;
  nextPrayerTime: string;
  accentColor?: string;
  primaryColor?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(progressPercent) ? progressPercent : 35));
  const radius = 64;
  const startAngle = Math.PI;
  const endAngle = 0;
  const currentAngle = startAngle - (clamped / 100) * Math.PI;

  const cx = 85;
  const cy = 76;
  const startX = cx + radius * Math.cos(startAngle);
  const startY = cy - radius * Math.sin(startAngle);
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy - radius * Math.sin(endAngle);

  const knobX = cx + radius * Math.cos(currentAngle);
  const knobY = cy - radius * Math.sin(currentAngle);

  const arcLength = Math.PI * radius;
  const dashOffset = arcLength * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center justify-center relative py-1">
      <div className="relative w-[170px] h-[94px] flex items-end justify-center">
        <svg viewBox="0 0 170 92" className="w-full h-full overflow-visible">
          <path
            d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
            fill="none"
            stroke={accentColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
          />
          <circle
            cx={knobX}
            cy={knobY}
            r="5.5"
            fill={accentColor}
            stroke="#041511"
            strokeWidth="2"
          />
        </svg>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center">
          <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-black mb-1 border"
            style={{
              background: 'rgba(16, 185, 129, 0.18)',
              borderColor: primaryColor,
              color: '#6EE7B7',
            }}
          >
            نماز بعدی
          </span>
          <div className="text-sm font-black text-white leading-tight">{nextPrayerName}</div>
        </div>
      </div>

      <div
        className="text-2xl sm:text-[26px] font-black tracking-wider mt-0.5"
        style={{ color: accentColor }}
      >
        {nextPrayerTime}
      </div>

      <div
        className="mt-1.5 px-3 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1.5"
        style={{
          background: 'rgba(4, 21, 17, 0.65)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          color: '#D1FAE5',
        }}
      >
        <span>⏳</span>
        <span>{remainingText}</span>
      </div>
    </div>
  );
}

export function DynamicShrineHorizonArt({
  cityName = 'مشهد',
  nextPrayerKey = 'fajr',
  themeId,
}: {
  cityName?: string;
  nextPrayerKey?: string;
  themeId?: string;
}) {
  loadHeroConfig();
  const design = resolveActiveHeroDesign(cityName, nextPrayerKey);
  const bgImg = design.imageUrl || '/hero-default.jpg';

  return (
    <div
      className="w-full h-36 sm:h-40 relative overflow-hidden select-none rounded-3xl shadow-lg border"
      style={{ borderColor: 'rgba(251, 191, 36, 0.3)' }}
      data-theme-id={themeId}
    >
      <img
        src={bgImg}
        alt=""
        className="w-full h-full object-cover object-center"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/hero-default.jpg';
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(3, 16, 13, 0.45) 0%, rgba(5, 24, 19, 0.2) 50%, rgba(2, 10, 8, 0.85) 100%)',
        }}
      />
      <div className="absolute inset-x-0 bottom-2.5 px-4 flex items-center justify-center pointer-events-none">
        <span
          className="px-3 py-1 rounded-full text-[10px] font-black border backdrop-blur-md"
          style={{
            background: 'rgba(4, 21, 17, 0.78)',
            borderColor: 'rgba(251, 191, 36, 0.45)',
            color: '#FEF08A',
          }}
        >
          {design.titleFa || 'حرم مطهر امام رضا (ع)'}
        </span>
      </div>
    </div>
  );
}
