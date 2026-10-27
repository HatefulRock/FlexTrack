import { theme } from '../../constants/theme';

export const DAY_MS = 86_400_000;
export const WEEK_MS = 7 * DAY_MS;

// 3 to 4 evenly spaced, rounded ticks (steps of 1, 2, 2.5 or 5 × 10ⁿ) that enclose [min, max].
export const niceTicks = (min: number, max: number) => {
  if (!(max > min)) { const pad = Math.max(Math.abs(max) * 0.05, 1); min -= pad; max += pad; }
  const raw = (max - min) / 3;
  const mag = 10 ** Math.floor(Math.log10(raw));
  let step = mag, lo = min, n = 0;
  for (const nice of [1, 2, 2.5, 5, 10, 20, 25, 50]) {
    step = nice * mag;
    lo = Math.floor(min / step + 1e-9) * step;
    n = Math.round((Math.ceil(max / step - 1e-9) * step - lo) / step);
    if (n <= 3) break;
  }
  n = Math.max(2, n);
  const decimals = Math.max(0, Math.min(3, -Math.floor(Math.log10(step) + 1e-9) + (Math.abs(step / mag - Math.round(step / mag)) > 1e-6 ? 1 : 0)));
  const ticks = Array.from({ length: n + 1 }, (_, i) => Number((lo + i * step).toFixed(decimals)));
  return { ticks, lo: ticks[0], hi: ticks[ticks.length - 1], decimals };
};

export const trimNumber = (v: number, decimals = 1) => {
  const r = Number(v.toFixed(decimals));
  return Number.isInteger(r) ? String(r) : r.toFixed(decimals).replace(/0+$/, '');
};

export const shortDate = (t: number, withYear = false) => {
  const d = new Date(t);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, withYear && !sameYear ? { month: 'short', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric' });
};

const clock = (minutes: number) => {
  const total = Math.round(minutes * 60);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

// A metric value split into the display number and its unit, e.g. { value: '112.5', unit: 'kg' }.
export const formatMetric = (key: string, v: number): { value: string; unit: string } => {
  if (key === 'weight' || key === 'oneRM' || key === 'assistance') return { value: trimNumber(v, 1), unit: 'kg' };
  if (key === 'bestReps' || key === 'totalReps') return { value: String(Math.round(v)), unit: Math.round(v) === 1 ? 'rep' : 'reps' };
  if (key === 'distance') return { value: trimNumber(v, 2), unit: 'km' };
  if (key === 'pace') return { value: clock(v), unit: '/km' };
  if (key === 'duration') return v >= 1 ? { value: clock(v), unit: 'min' } : { value: String(Math.round(v * 60)), unit: 's' };
  return { value: trimNumber(v, 1), unit: '' };
};
export const metricText = (key: string, v: number) => { const m = formatMetric(key, v); return m.unit ? `${m.value} ${m.unit}` : m.value; };

// Pick chalk or rubber text for a fill, whichever contrasts more.
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const lum = (rgb: number[]) => { const [r, g, b] = rgb.map(x => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const mix = (base: string, top: string, alpha: number) => { const a = hex(base), b = hex(top); return a.map((x, i) => Math.round(x * (1 - alpha) + b[i] * alpha)); };
export const inkOn = (rgb: number[]) => {
  const L = lum(rgb), light = lum(hex(theme.colors.text)), dark = lum(hex(theme.colors.onPrimary));
  return (light + 0.05) / (L + 0.05) >= (L + 0.05) / (dark + 0.05) ? theme.colors.text : theme.colors.onPrimary;
};
export const rgb = (c: number[]) => `rgb(${c.join(',')})`;
