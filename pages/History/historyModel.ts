import { ActivityCategory, WorkoutLog } from '../../types';
import { Category, exerciseCategory } from '../../utils/training';
import { theme } from '../../constants/theme';

export const ACTIVITY_LABEL: Record<ActivityCategory, string> = { strength: 'Strength', run: 'Run', walk: 'Walk', cycle: 'Cycle', timed: 'Timed', other: 'Other' };

export const CATEGORY_ORDER: Category[] = ['push', 'pull', 'legs', 'cardio', 'other'];
export type CategoryShare = { category: Category; sets: number };

// Every category a session trained, weighted by completed sets (all sets if none were completed), in push/pull/legs/cardio order.
// "Other" only counts when it is the only category present.
export const sessionCategories = (log: WorkoutLog): CategoryShare[] => {
  const a = log.activityCategory;
  if (log.source === 'quick' && (a === 'run' || a === 'walk' || a === 'cycle')) return [{ category: 'cardio', sets: 1 }];
  if (!log.exercises.length) return [{ category: exerciseCategory(log.templateName), sets: 1 }];
  const anyDone = log.exercises.some(e => e.sets.some(s => s.completed));
  const weights = new Map<Category, number>();
  log.exercises.forEach(e => {
    const n = anyDone ? e.sets.filter(s => s.completed).length : Math.max(1, e.sets.length);
    if (n > 0) { const c = exerciseCategory(e.exerciseName, e.exerciseType); weights.set(c, (weights.get(c) || 0) + n); }
  });
  const shares = CATEGORY_ORDER.filter(c => weights.has(c)).map(c => ({ category: c, sets: weights.get(c)! }));
  const real = shares.filter(s => s.category !== 'other');
  return real.length ? real : shares.length ? shares : [{ category: 'other', sets: 1 }];
};

// Merge several sessions' shares (e.g. one calendar day), summing sets per category.
export const mergeShares = (lists: CategoryShare[][]): CategoryShare[] => {
  const w = new Map<Category, number>();
  lists.flat().forEach(s => w.set(s.category, (w.get(s.category) || 0) + s.sets));
  return CATEGORY_ORDER.filter(c => w.has(c)).map(c => ({ category: c, sets: w.get(c)! }));
};

// The dominant category (most sets; push/pull/legs/cardio order breaks ties).
export const sessionCategory = (log: WorkoutLog): Category =>
  sessionCategories(log).reduce((b, s) => (s.sets > b.sets ? s : b)).category;

export const sessionMs = (log: WorkoutLog) => Math.max(0, (log.endTime || log.startTime) - log.startTime);

// WCAG relative luminance and contrast, used to pick rubber or chalk text on a category fill.
const lum = (hex: string) => {
  const v = hex.replace('#', '');
  const ch = [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};
export const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

// Best text colour across every stripe of a cell; `backed` means neither reaches 4.5:1 and the label needs a rubber tile.
export const labelOn = (fills: string[]) => {
  const options = [theme.colors.text, theme.colors.canvas].map(c => ({ c, min: Math.min(...fills.map(f => contrast(c, f))) }));
  const best = options.sort((m, n) => n.min - m.min)[0];
  return { color: best.min >= 4.5 ? best.c : theme.colors.text, backed: best.min < 4.5 };
};
