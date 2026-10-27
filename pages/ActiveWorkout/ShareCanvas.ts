import { Platform } from 'react-native';
import { theme } from '../../constants/theme';
import { CARD_H, CARD_W, Op, Run, ShareData, layoutCard } from './ShareLayout';

// Web fallback for the share card: react-native-view-shot cannot capture on web, so the same display list
// is drawn onto a 1080×1350 canvas and downloaded as a PNG. Every function is a no-op off the web.
const isWeb = () => Platform.OS === 'web' && typeof document !== 'undefined';

const font = (r: Run) => `${r.size}px "${r.family}"`;

const ellipsize = (ctx: CanvasRenderingContext2D, value: string, max: number) => {
  if (ctx.measureText(value).width <= max) return value;
  let t = value;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
};

const drawText = (ctx: CanvasRenderingContext2D, o: Extract<Op, { kind: 'text' }>) => {
  // Match a CSS line box: the first run's ascent + descent sits centred in the line height.
  ctx.font = font(o.runs[0]);
  const m = ctx.measureText('Hg');
  const ascent = m.fontBoundingBoxAscent ?? o.runs[0].size * 0.8, descent = m.fontBoundingBoxDescent ?? o.runs[0].size * 0.2;
  const baseline = o.y + (o.lh - (ascent + descent)) / 2 + ascent;
  const texts = o.runs.map((r, i) => { ctx.font = font(r); return o.runs.length === 1 && i === 0 ? ellipsize(ctx, r.text, o.w) : r.text; });
  const widths = o.runs.map((r, i) => { ctx.font = font(r); return ctx.measureText(texts[i]).width; });
  let x = o.align === 'right' ? o.x + o.w - widths.reduce((a, b) => a + b, 0) : o.x;
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  o.runs.forEach((r, i) => { ctx.font = font(r); ctx.fillStyle = r.color; ctx.fillText(texts[i], x, baseline); x += widths[i]; });
};

export const drawShareCard = async (data: ShareData): Promise<HTMLCanvasElement | null> => {
  if (!isWeb()) return null;
  const ops = layoutCard(data);
  const families = new Set<string>();
  ops.forEach(o => { if (o.kind === 'text') o.runs.forEach(r => families.add(font(r))); });
  await Promise.all([...families].map(f => document.fonts.load(f).catch(() => undefined)));
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W; canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');
  ctx.fillStyle = theme.colors.canvas;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ops.forEach(o => {
    if (o.kind === 'text') return drawText(ctx, o);
    ctx.fillStyle = o.color;
    ctx.beginPath();
    if (o.r && ctx.roundRect) ctx.roundRect(o.x, o.y, o.w, o.h, o.r); else ctx.rect(o.x, o.y, o.w, o.h);
    ctx.fill();
  });
  return canvas;
};

export const downloadShareCard = async (data: ShareData): Promise<void> => {
  if (!isWeb()) return;
  const canvas = await drawShareCard(data);
  if (!canvas) return;
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not encode the image');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = data.fileName; a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
