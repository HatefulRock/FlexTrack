import { format } from 'date-fns';
import { theme } from '../../constants/theme';
import { formatTime } from '../../utils/time';

export const DAY_MS = 86_400_000;
const MAX_TICK_DECIMALS = 6;

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
  // Exactly enough decimals for the step (2.5 needs one), so rounded ticks never collapse into duplicates.
  const halfStep = Math.abs(step / mag - Math.round(step / mag)) > 1e-6 ? 1 : 0;
  const decimals = Math.max(0, Math.min(MAX_TICK_DECIMALS, -Math.floor(Math.log10(step) + 1e-9) + halfStep));
  const ticks = Array.from({ length: n + 1 }, (_, i) => Number((lo + i * step).toFixed(decimals)));
  return { ticks, lo: ticks[0], hi: ticks[ticks.length - 1], decimals };
};

export const trimNumber = (v: number, decimals = 1) => String(Number(v.toFixed(decimals)));

export const shortDate = (t: number, withYear = false) =>
  format(t, withYear && new Date(t).getFullYear() !== new Date().getFullYear() ? 'MMM d, yyyy' : 'MMM d');

const clock = (minutes: number) => formatTime(Math.round(minutes * 60));

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

// One scale for a whole chart: pace always reads m:ss, and a duration series reads m:ss unless every entry is under a minute.
export const chartScale = (key: string, values: number[]): { unit: string; format?: (v: number) => string } => {
  if (key === 'pace') return { unit: '/km', format: clock };
  if (key === 'duration') return values.some(v => v >= 1) ? { unit: 'min', format: clock } : { unit: 's', format: v => String(Math.round(v * 60)) };
  return { unit: formatMetric(key, values[values.length - 1] ?? 0).unit };
};

// WCAG relative luminance and contrast, used to pick chalk or rubber text on a fill.
export const hexToRgb = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const luminance = (rgb: number[]) => {
  const [r, g, b] = rgb.map(x => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrastRatio = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (hi + 0.05) / (lo + 0.05);
};
export const mix = (base: string, top: string, alpha: number) => { const a = hexToRgb(base), b = hexToRgb(top); return a.map((x, i) => Math.round(x * (1 - alpha) + b[i] * alpha)); };
export const inkOn = (fill: number[]) =>
  contrastRatio(hexToRgb(theme.colors.text), fill) >= contrastRatio(fill, hexToRgb(theme.colors.onPrimary)) ? theme.colors.text : theme.colors.onPrimary;
export const rgb = (c: number[]) => `rgb(${c.join(',')})`;
