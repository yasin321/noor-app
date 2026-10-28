
try {
  const savedFont = localStorage.getItem('noor_font_family') || 'Vazirmatn';
  const mapFont: Record<string, string> = {
    Vazirmatn: "'Vazirmatn', system-ui, sans-serif",
    Shabnam: "'Shabnam', 'Vazirmatn', sans-serif",
    Sahel: "'Sahel', 'Vazirmatn', sans-serif",
    Samim: "'Samim', 'Vazirmatn', sans-serif",
  };
  document.documentElement.style.setProperty('--app-font', mapFont[savedFont] || mapFont.Vazirmatn);
  const savedScale = localStorage.getItem('noor_font_scale') || 'normal';
  const sizeMap: Record<string, string> = { normal: '16px', medium: '17.5px', senior: '19.5px' };
  document.documentElement.style.fontSize = sizeMap[savedScale] || '16px';
} catch {}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
