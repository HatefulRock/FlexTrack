import { WorkoutLog } from '../../types';
import { fonts, theme } from '../../constants/theme';
import { RecordHit, categoryColor, exerciseCategory, formatDuration, formatNumber } from '../../utils/training';
import { bestSet, recordValue, recordWas, whiteLights } from './SummaryParts';

// The shareable session card: a 1080×1350 (4:5) meet-scoreboard result.
// One layout function emits a display list of rects and text runs in card pixels, so the native view
// (ShareCard) and the web canvas (ShareCanvas) draw exactly the same composition.

const c = theme.colors;
export const CARD_W = 1080;
export const CARD_H = 1350;
const P = 72, INNER = CARD_W - P * 2, R = 24;

export interface ShareData {
  name: string; date: string; fileName: string;
  white: number; verdict: string; verdictDetail: string;
  duration: string; sets: string; setsLabel: string; volume: string;
  records: { name: string; value: string; was: string }[];
  exercises: { name: string; color: string; best: string; skipped: boolean }[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

const VERDICT = ['No white lights', '1 of 3 lights', '2 of 3 lights', 'Good lift'];
const VERDICT_DETAIL = ['Under a third of the sets done', 'A third of the sets done', 'Two-thirds of the sets done', 'Every set done'];

export const buildShareData = (log: WorkoutLog, s: { doneSets: number; totalSets: number; volume: number; duration: number; records: RecordHit[] }): ShareData => {
  const d = new Date(log.startTime);
  const name = log.templateName?.trim() || 'Session';
  const white = whiteLights(s.doneSets, s.totalSets);
  const complete = s.totalSets > 0 && s.doneSets === s.totalSets;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'session';
  return {
    name, white, verdict: VERDICT[white], verdictDetail: VERDICT_DETAIL[white],
    date: `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    fileName: `flextrack-${slug}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.png`,
    duration: formatDuration(s.duration),
    sets: String(s.doneSets), setsLabel: complete ? 'Sets' : `of ${s.totalSets} sets`,
    volume: formatNumber(s.volume),
    records: s.records.map(r => ({ name: r.exerciseName, value: recordValue(r), was: r.kind === 'oneRM' ? `est. 1RM ${recordWas(r)}` : recordWas(r) })),
    exercises: log.exercises.map(e => ({
      name: e.exerciseName, color: categoryColor(exerciseCategory(e.exerciseName, e.exerciseType)),
      best: bestSet(e), skipped: !e.sets.some(x => x.completed),
    })),
  };
};

// What a screen reader hears for the card image.
export const describeShare = (d: ShareData) => [
  `${d.name}, ${d.date}.`, `${d.verdict}: ${d.verdictDetail.toLowerCase()}.`,
  `Duration ${d.duration}, ${d.sets} ${d.setsLabel === 'Sets' ? 'sets' : d.setsLabel}, volume ${d.volume} kilograms.`,
  d.records.length ? `${d.records.length === 1 ? 'New record' : `${d.records.length} records`}: ${d.records.map(r => `${r.name} ${r.value}`).join(', ')}.` : '',
  d.exercises.map(e => `${e.name}${e.best ? ` ${e.best.replace('×', 'by')}` : e.skipped ? ' skipped' : ''}`).join(', '),
].filter(Boolean).join(' ');

export type Run = { text: string; size: number; family: string; color: string };
export type Op =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r: number; color: string }
  | { kind: 'text'; x: number; y: number; w: number; lh: number; align: 'left' | 'right'; runs: Run[] };

const rect = (x: number, y: number, w: number, h: number, r: number, color: string): Op => ({ kind: 'rect', x, y, w, h, r, color });
const text = (x: number, y: number, w: number, lh: number, runs: Run[], align: 'left' | 'right' = 'left'): Op => ({ kind: 'text', x, y, w, lh, align, runs });
const run = (t: string, size: number, family: string, color: string): Run => ({ text: t, size, family, color });

export const layoutCard = (d: ShareData): Op[] => {
  const ops: Op[] = [];

  // Wordmark and date share the top line, like a scoreboard header.
  ops.push(text(P, 64, 400, 52, [run('FlexTrack', 44, fonts.displayBlack, c.text)]));
  ops.push(text(P + INNER - 560, 64, 560, 52, [run(d.date, 34, fonts.textMedium, c.textMuted)], 'right'));

  // Session name: the big condensed title, sized to its length so it stays on one line.
  const nameSize = Math.round(Math.max(96, Math.min(150, INNER / (Math.max(1, d.name.length) * 0.46))));
  ops.push(text(P, 128, INNER, 168, [run(d.name, nameSize, fonts.display, c.text)]));

  // Judges' lights board with the verdict printed beside it.
  const y1 = 320, light = 88, gap = 28, board = 24 * 2 + light * 3 + gap * 2;
  ops.push(rect(P, y1, board, 136, R, c.surface));
  [0, 1, 2].forEach(i => ops.push(rect(P + 24 + i * (light + gap), y1 + 24, light, light, light / 2, i < d.white ? c.done : c.dangerFill)));
  const vx = P + board + 32, vw = P + INNER - vx;
  ops.push(text(vx, y1 + 4, vw, 72, [run(d.verdict, 64, fonts.display, c.text)]));
  ops.push(text(vx, y1 + 80, vw, 44, [run(d.verdictDetail, 34, fonts.textMedium, c.textMuted)]));

  // Scoreboard: duration · sets · volume.
  const y2 = y1 + 136 + 24, cell = INNER / 3;
  ops.push(rect(P, y2, INNER, 168, R, c.surface));
  const scores: { runs: Run[]; label: string }[] = [
    { runs: [run(d.duration, d.duration.length > 6 ? 72 : 88, fonts.display, c.text)], label: 'Duration' },
    { runs: [run(d.sets, 88, fonts.display, c.text)], label: d.setsLabel },
    { runs: [run(d.volume, d.volume.length > 6 ? 72 : 88, fonts.display, c.text), run(' kg', 44, fonts.display, c.textMuted)], label: 'Volume' },
  ];
  scores.forEach((s, i) => {
    const x = P + cell * i;
    if (i) ops.push(rect(x - 1, y2 + 28, 2, 120, 0, c.border));
    ops.push(text(x + 32, y2 + 20, cell - 48, 96, s.runs));
    ops.push(text(x + 32, y2 + 112, cell - 48, 40, [run(s.label, 34, fonts.textMedium, c.textMuted)]));
  });
  let y = y2 + 168 + 24;

  // Records: the yellow plate, and only for records.
  if (d.records.length) {
    const shown = d.records.slice(0, 2), rowH = 64;
    const h = 24 + 56 + 4 + shown.length * rowH + 24;
    ops.push(rect(P, y, INNER, h, R, c.record));
    ops.push(text(P + 32, y + 24, INNER - 64, 56, [run(d.records.length === 1 ? 'New record' : `${d.records.length} new records`, 52, fonts.display, c.onRecord)]));
    shown.forEach((r, i) => {
      const ry = y + 24 + 56 + 4 + i * rowH;
      ops.push(text(P + 32, ry, INNER - 64 - 280, rowH, [run(r.name, 38, fonts.textSemiBold, c.onRecord), run(`  ${r.was}`, 34, fonts.textMedium, c.onRecord)]));
      ops.push(text(P + INNER - 32 - 280, ry, 280, rowH, [run(r.value, 58, fonts.display, c.onRecord)], 'right'));
    });
    y += h + 24;
  }

  // Exercise lines fill what is left; an overflow line counts the rest.
  const rowH = 84, bottom = CARD_H - 64;
  const fit = Math.max(1, Math.floor((bottom - y - 16) / rowH));
  const rows = d.exercises.length <= fit ? d.exercises : d.exercises.slice(0, fit - 1);
  const more = d.exercises.length - rows.length;
  const count = rows.length + (more ? 1 : 0);
  if (count) {
    ops.push(rect(P, y, INNER, count * rowH + 16, R, c.surface));
    rows.forEach((e, i) => {
      const ry = y + 8 + i * rowH;
      if (i) ops.push(rect(P + 32, ry - 1, INNER - 64, 2, 0, c.border));
      ops.push(rect(P + 32, ry + (rowH - 28) / 2, 28, 28, 6, e.color));
      ops.push(text(P + 84, ry, INNER - 84 - 32 - 300, rowH, [run(e.name, 38, fonts.textSemiBold, e.skipped ? c.textMuted : c.text)]));
      ops.push(text(P + INNER - 32 - 300, ry, 300, rowH, [run(e.best || (e.skipped ? 'Skipped' : ''), e.best ? 56 : 34, e.best ? fonts.display : fonts.textMedium, e.best ? c.text : c.textMuted)], 'right'));
    });
    if (more) {
      const ry = y + 8 + rows.length * rowH;
      if (rows.length) ops.push(rect(P + 32, ry - 1, INNER - 64, 2, 0, c.border));
      ops.push(text(P + 32, ry, INNER - 64, rowH, [run(`+ ${more} more ${more === 1 ? 'exercise' : 'exercises'}`, 34, fonts.textMedium, c.textMuted)]));
    }
  }
  return ops;
};
