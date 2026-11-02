import { startOfWeek, subWeeks } from 'date-fns';
import { WorkoutLog, WorkoutTemplate } from '../../types';
import { CARDIO_COLOR, NEUTRAL_COLOR, logColor } from '../../utils/workoutColor';

export interface HeatRow { key: string; label: string; color: string; values: number[] }

const MAX_ROWS = 6;
const INSIGHT_WEEKS = 4;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const isCardio = (l: WorkoutLog) => l.source === 'quick' && (l.activityCategory === 'run' || l.activityCategory === 'walk' || l.activityCategory === 'cycle');

// Rows = workouts, columns = weeks; a cell is that workout's completed sets that week. Quick-logged runs, walks and rides
// share a Cardio row counting sessions; other quick logs and anything past the six busiest rows fall into Other.
export const workoutHeat = (logs: WorkoutLog[], templates: WorkoutTemplate[], weekCount: number, now = new Date()) => {
  const weeks = Array.from({ length: weekCount }, (_, i) => startOfWeek(subWeeks(now, weekCount - 1 - i)).getTime());
  const index = new Map(weeks.map((w, i) => [w, i]));
  const rows = new Map<string, HeatRow>();
  const add = (key: string, label: string, color: string, c: number, n: number) => {
    const row = rows.get(key) ?? { key, label, color, values: Array(weekCount).fill(0) };
    row.values[c] += n; rows.set(key, row);
  };
  [...logs].sort((a, b) => b.startTime - a.startTime).forEach(l => {
    const c = index.get(startOfWeek(new Date(l.startTime)).getTime());
    if (c === undefined) return;
    const sets = l.exercises.reduce((sum, e) => sum + e.sets.filter(s => s.completed).length, 0);
    if (isCardio(l)) add('cardio', 'Cardio', CARDIO_COLOR, c, 1);
    else if (l.source === 'quick') add('other', 'Other', NEUTRAL_COLOR, c, Math.max(1, sets));
    else if (sets) {
      // The newest name a workout was logged under labels its row, so a renamed workout stays one row.
      const template = l.templateId ? templates.find(t => t.id === l.templateId) : undefined;
      add(l.templateId || `name:${l.templateName}`, template?.name ?? l.templateName, logColor(l, templates), c, sets);
    }
  });
  const total = (r: HeatRow) => r.values.reduce((a, b) => a + b, 0);
  const named = [...rows.values()].filter(r => r.key !== 'cardio' && r.key !== 'other').sort((a, b) => total(b) - total(a));
  const kept = named.slice(0, MAX_ROWS);
  const other = rows.get('other');
  named.slice(MAX_ROWS).forEach(r => {
    const o = other ?? { key: 'other', label: 'Other', color: NEUTRAL_COLOR, values: Array(weekCount).fill(0) };
    r.values.forEach((v, i) => { o.values[i] += v; }); rows.set('other', o);
  });
  const result = [...kept, ...['cardio', 'other'].map(k => rows.get(k)).filter((r): r is HeatRow => !!r)];
  return { weeks, rows: result, insight: workoutInsight(kept) };
};

// One sentence on which workout carried the last four weeks.
const workoutInsight = (rows: HeatRow[]) => {
  const span = `the last ${INSIGHT_WEEKS} weeks`;
  const recent = rows.map(r => ({ label: r.label, n: r.values.slice(-INSIGHT_WEEKS).reduce((a, b) => a + b, 0) })).filter(r => r.n > 0).sort((a, b) => b.n - a.n);
  if (!recent.length) return `No workout sets in ${span}.`;
  if (recent.length === 1) return `${recent[0].label} is the only workout you did in ${span} (${plural(recent[0].n, 'set')}).`;
  return `${recent[0].label} led ${span} with ${plural(recent[0].n, 'set')}; ${recent[recent.length - 1].label} had the fewest (${recent[recent.length - 1].n}).`;
};
