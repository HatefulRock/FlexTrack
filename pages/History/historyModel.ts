import { ActivityCategory, WorkoutLog } from '../../types';
import { Category, exerciseCategory } from '../../utils/training';
import { theme } from '../../constants/theme';
import { contrastRatio, hexToRgb } from '../Stats/chartUtils';

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

export const sessionMs = (log: WorkoutLog) => Math.max(0, (log.endTime || log.startTime) - log.startTime);

const MIN_TEXT_CONTRAST = 4.5; // WCAG AA for normal text
const contrast = (a: string, b: string) => contrastRatio(hexToRgb(a), hexToRgb(b));

// Best text colour across every stripe of a cell; `backed` means neither reaches AA contrast and the label needs a rubber tile.
export const labelOn = (fills: string[]) => {
  const options = [theme.colors.text, theme.colors.canvas].map(c => ({ c, min: Math.min(...fills.map(f => contrast(c, f))) }));
  const best = options.sort((m, n) => n.min - m.min)[0];
  const readable = best.min >= MIN_TEXT_CONTRAST;
  return { color: readable ? best.c : theme.colors.text, backed: !readable };
};
