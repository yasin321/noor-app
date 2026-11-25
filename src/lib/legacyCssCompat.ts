interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

const NAMED_COLORS: Record<string, RgbaColor> = {
  transparent: { r: 0, g: 0, b: 0, a: 0 },
  white: { r: 255, g: 255, b: 255, a: 1 },
  black: { r: 0, g: 0, b: 0, a: 1 },
};

function resolveCssVar(token: string): string {
  const trimmed = token.trim();
  const m = trimmed.match(/^var\(\s*(--[a-zA-Z0-9_-]+)(?:\s*,\s*([^)]+))?\s*\)$/);
  if (!m) return trimmed;
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const val = window.getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim();
    if (val) return val;
  }
  return (m[2] || '').trim();
}

function parseColor(raw: string): RgbaColor | null {
  const c = resolveCssVar(raw).toLowerCase();
  if (!c) return null;
  if (NAMED_COLORS[c]) return { ...NAMED_COLORS[c] };

  if (c.startsWith('#')) {
    const hex = c.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1;
      return { r, g, b, a };
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, a };
    }
    return null;
  }

  const rgbMatch = c.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/);
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
      a: rgbMatch[4] !== undefined ? Number(rgbMatch[4]) : 1,
    };
  }
  return null;
}

function splitTopLevelCommas(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(input.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(input.slice(start).trim());
  return parts;
}

function splitColorAndPercent(part: string): { color: string; pct: number | null } {
  const trimmed = part.trim();
  const after = trimmed.match(/^(.*?)\s+(\d+(?:\.\d+)?)%$/);
  if (after) {
    return { color: after[1].trim(), pct: Number(after[2]) / 100 };
  }
  const before = trimmed.match(/^(\d+(?:\.\d+)?)%\s+(.*)$/);
  if (before) {
    return { color: before[2].trim(), pct: Number(before[1]) / 100 };
  }
  return { color: trimmed, pct: null };
}

function mixSingleExpression(inner: string): string | null {
  const parts = splitTopLevelCommas(inner);
  if (parts.length < 3) return null;
  const p1 = splitColorAndPercent(parts[1]);
  const p2 = splitColorAndPercent(parts[2]);
  const c1 = parseColor(p1.color);
  const c2 = parseColor(p2.color);
  if (!c1 || !c2) return null;

  let w1 = p1.pct;
  let w2 = p2.pct;
  if (w1 === null && w2 === null) {
    w1 = 0.5;
    w2 = 0.5;
  } else if (w1 !== null && w2 === null) {
    w2 = Math.max(0, 1 - w1);
  } else if (w1 === null && w2 !== null) {
    w1 = Math.max(0, 1 - w2);
  }
  const sum = (w1 ?? 0) + (w2 ?? 0);
  if (sum <= 0) return 'rgba(0, 0, 0, 0)';
  const nw1 = (w1 ?? 0) / sum;
  const nw2 = (w2 ?? 0) / sum;

  const outA = c1.a * nw1 + c2.a * nw2;
  if (outA <= 0.001) return 'rgba(0, 0, 0, 0)';
  const outR = Math.round((c1.r * c1.a * nw1 + c2.r * c2.a * nw2) / outA);
  const outG = Math.round((c1.g * c1.a * nw1 + c2.g * c2.a * nw2) / outA);
  const outB = Math.round((c1.b * c1.a * nw1 + c2.b * c2.a * nw2) / outA);
  const cleanA = Math.round(outA * 1000) / 1000;
  return `rgba(${outR}, ${outG}, ${outB}, ${cleanA})`;
}

export function resolveLegacyColorMix(value: string): string {
  if (!value || !value.includes('color-mix(')) return value;
  let result = '';
  let idx = 0;

  while (idx < value.length) {
    const pos = value.indexOf('color-mix(', idx);
    if (pos === -1) {
      result += value.slice(idx);
      break;
    }
    result += value.slice(idx, pos);

    let depth = 0;
    let end = -1;
    for (let i = pos + 'color-mix'.length; i < value.length; i++) {
      if (value[i] === '(') depth++;
      else if (value[i] === ')') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) {
      result += value.slice(pos);
      break;
    }

    const inner = value.slice(pos + 'color-mix('.length, end);
    const mixed = mixSingleExpression(inner);
    result += mixed ?? value.slice(pos, end + 1);
    idx = end + 1;
  }

  return result;
}

let polyfillInstalled = false;

export function installLegacyColorMixPolyfill(): boolean {
  if (polyfillInstalled || typeof window === 'undefined') return false;
  if (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('color', 'color-mix(in srgb, #10b981 50%, transparent)')
  ) {
    return false;
  }

  polyfillInstalled = true;
  try {
    const proto = CSSStyleDeclaration.prototype;
    const origSetProperty = proto.setProperty;
    proto.setProperty = function (name: string, value: string | null, priority?: string) {
      const next = typeof value === 'string' && value.includes('color-mix(')
        ? resolveLegacyColorMix(value)
        : value;
      return origSetProperty.call(this, name, next, priority);
    };

    const props: (keyof CSSStyleDeclaration)[] = [
      'background',
      'backgroundColor',
      'borderColor',
      'color',
      'boxShadow',
    ];
    for (const prop of props) {
      const desc = Object.getOwnPropertyDescriptor(proto, prop);
      if (desc && desc.set && desc.configurable) {
        const origSet = desc.set;
        Object.defineProperty(proto, prop, {
          ...desc,
          set(val: string) {
            const next = typeof val === 'string' && val.includes('color-mix(')
              ? resolveLegacyColorMix(val)
              : val;
            origSet.call(this, next);
          },
        });
      }
    }
  } catch {
    // ignore
  }
  return true;
}