import { startOfWeek } from 'date-fns';
import { ExerciseLog, ExerciseType, WorkoutLog } from '../types';
import { theme } from '../constants/theme';

export type Category = 'push' | 'pull' | 'legs' | 'cardio' | 'other';
export const CATEGORY_LABEL: Record<Category, string> = { push: 'Push', pull: 'Pull', legs: 'Legs', cardio: 'Cardio', other: 'Other' };
export const categoryColor = (c: Category) => theme.category[c];

// Strength keywords win over generic cardio words so "Walking Lunge" is legs; whole words keep "Lateral Raise" out of pull.
// Rowing ergometers are checked first because "row" alone means a barbell or cable row.
export const exerciseCategory = (name: string, type?: ExerciseType): Category => {
  const n = name.toLowerCase();
  if (type === 'distance' || /rowing|row machine|\berg\b/.test(n)) return 'cardio';
  if (/squat|\blegs?\b|lunge|calf|calves|deadlift|\brdl\b|hip thrust|step.?up/.test(n)) return 'legs';
  if (/pull|\brows?\b|curl|\bchin|\blats?\b|pulldown/.test(n)) return 'pull';
  if (/bench|press|push|\bdips?\b|\bfly|flye|tricep|raise/.test(n)) return 'push';
  if (/\brun|\bwalk|cycl|\bride|cardio|swim|hike/.test(n)) return 'cardio';
  return 'other';
};

// Calibrated plates per side, heaviest first, for a standard 20 kg bar.
export const BAR_KG = 20;
export const PLATE_SIZES = [25, 20, 15, 10, 5, 2.5, 1.25] as const;
export const platesPerSide = (total: number, bar = BAR_KG): { plates: number[]; remainder: number } => {
  let left = Math.max(0, (total - bar) / 2);
  const plates: number[] = [];
  PLATE_SIZES.forEach(p => { while (left + 1e-9 >= p) { plates.push(p); left -= p; } });
  return { plates, remainder: Math.round(left * 100) / 100 };
};

export const estimate1RM = (weight = 0, reps = 0) => (weight > 0 && reps > 0 ? weight * (1 + reps / 30) : 0);

export const formatDuration = (ms: number) => {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  if (totalMinutes < 1) return `${Math.max(0, Math.round(ms / 1000))}s`;
  const h = Math.floor(totalMinutes / 60), m = totalMinutes % 60;
  return h ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
};

// Up to two decimals so plate maths stays loadable: 33.75 kg a side, never a rounded 33.8.
export const formatDecimal = (n: number) => String(Number(n.toFixed(2)));
export const formatKg = (kg: number) => `${formatDecimal(kg)} kg`;
export const formatNumber = (n: number) => Math.round(n).toLocaleString('en-US');

// Lifted volume only: on assisted sets the weight is help from the machine, so it never counts.
export const logVolume = (log: WorkoutLog) => log.exercises.reduce((sum, e) => e.loadMode === 'assisted' ? sum
  : sum + e.sets.filter(s => s.completed).reduce((n, s) => n + (s.weight || 0) * (s.reps || 0), 0), 0);

// Sessions since Sunday, matching the Sunday-to-Saturday week strip on Today.
export const sessionsThisWeek = (logs: WorkoutLog[], now = new Date()) => {
  const from = startOfWeek(now).getTime();
  return logs.filter(l => (l.endTime || l.startTime) >= from).length;
};

// A streak survives until the end of today: training yesterday keeps it alive.
export const currentStreak = (logs: WorkoutLog[], now = new Date()) => {
  const days = new Set(logs.map(l => new Date(l.startTime).toDateString()));
  const day = new Date(now);
  if (!days.has(day.toDateString())) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (days.has(day.toDateString())) { streak++; day.setDate(day.getDate() - 1); }
  return streak;
};

export interface RecordHit { exerciseName: string; kind: 'weight' | 'oneRM' | 'reps'; value: number; previous: number; }

// Records set in `log` against every earlier session of the same exercise (matched by id, then by name).
export const detectRecords = (log: WorkoutLog, previousLogs: WorkoutLog[]): RecordHit[] => {
  const hits: RecordHit[] = [];
  const prior = previousLogs.filter(l => l.id !== log.id && (l.endTime || l.startTime) < (log.endTime || Date.now()));
  log.exercises.forEach(e => {
    const done = e.sets.filter(s => s.completed);
    if (!done.length || (e.exerciseType && e.exerciseType !== 'reps')) return;
    const history = prior.flatMap(l => l.exercises.filter(x => x.exerciseId === e.exerciseId || x.exerciseName.toLowerCase() === e.exerciseName.toLowerCase()))
      .flatMap((x: ExerciseLog) => x.sets.filter(s => s.completed));
    if (!history.length) return;
    const best = (sets: typeof done, f: (s: typeof done[number]) => number) => sets.reduce((top, s) => Math.max(top, f(s)), 0);
    const loaded = e.loadMode !== 'bodyweight' && e.loadMode !== 'assisted';
    if (loaded) {
      const w = best(done, s => s.weight || 0), pw = best(history, s => s.weight || 0);
      if (w > pw && w > 0) { hits.push({ exerciseName: e.exerciseName, kind: 'weight', value: w, previous: pw }); return; }
      const r = best(done, s => estimate1RM(s.weight, s.reps)), pr = best(history, s => estimate1RM(s.weight, s.reps));
      if (r > pr + 0.5 && r > 0) hits.push({ exerciseName: e.exerciseName, kind: 'oneRM', value: Math.round(r * 10) / 10, previous: Math.round(pr * 10) / 10 });
    } else {
      const r = best(done, s => s.reps || 0), pr = best(history, s => s.reps || 0);
      if (r > pr && r > 0) hits.push({ exerciseName: e.exerciseName, kind: 'reps', value: r, previous: pr });
    }
  });
  return hits;
};
