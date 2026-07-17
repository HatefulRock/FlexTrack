import { ExerciseLog, WorkoutLog } from '../types';

export type ProgressKind = 'external' | 'bodyweight' | 'assisted' | 'distance' | 'timer';
export interface MetricOption { key: string; label: string; subtitle: string; unit: string; better: 'high' | 'low'; }

export const resolveKind = (exercise: ExerciseLog): ProgressKind => {
  if (exercise.exerciseType === 'distance' || exercise.sets.some(s => (s.distance || 0) > 0)) return 'distance';
  if (exercise.exerciseType === 'timer' || exercise.sets.some(s => (s.durationSeconds || 0) > 0 && !s.reps && !s.distance)) return 'timer';
  if (exercise.loadMode) return exercise.loadMode;
  return exercise.sets.some(s => (s.weight || 0) > 0) ? 'external' : 'bodyweight';
};

export const metricOptions = (kind: ProgressKind): MetricOption[] => ({
  external: [
    { key: 'weight', label: 'Weight', subtitle: 'Heaviest load', unit: 'kg', better: 'high' },
    { key: 'oneRM', label: '1RM', subtitle: 'Estimated 1 rep max', unit: 'kg', better: 'high' },
  ],
  bodyweight: [
    { key: 'bestReps', label: 'Best set', subtitle: 'Most reps in one set', unit: ' reps', better: 'high' },
    { key: 'totalReps', label: 'Total reps', subtitle: 'Completed reps per session', unit: ' reps', better: 'high' },
  ],
  assisted: [
    { key: 'assistance', label: 'Assistance', subtitle: 'Lowest assistance used', unit: 'kg', better: 'low' },
    { key: 'bestReps', label: 'Best set', subtitle: 'Most reps in one set', unit: ' reps', better: 'high' },
  ],
  distance: [
    { key: 'distance', label: 'Distance', subtitle: 'Longest completed distance', unit: 'km', better: 'high' },
    { key: 'pace', label: 'Pace', subtitle: 'Fastest minutes per kilometre', unit: ' min/km', better: 'low' },
  ],
  timer: [
    { key: 'duration', label: 'Duration', subtitle: 'Longest completed duration', unit: ' min', better: 'high' },
  ],
}[kind] as MetricOption[]);

const distanceKm = (value: number, unit: ExerciseLog['distanceUnit']) => unit === 'm' ? value / 1000 : unit === 'miles' ? value * 1.609344 : value;

export const metricValue = (exercise: ExerciseLog, key: string): number | null => {
  const sets = exercise.sets.filter(s => s.completed);
  if (!sets.length) return null;
  if (key === 'weight') return Math.max(...sets.map(s => s.weight || 0)) || null;
  if (key === 'oneRM') return Math.max(...sets.map(s => (s.weight || 0) * (1 + (s.reps || 0) / 30))) || null;
  if (key === 'bestReps') return Math.max(...sets.map(s => s.reps || 0)) || null;
  if (key === 'totalReps') return sets.reduce((n, s) => n + (s.reps || 0), 0) || null;
  if (key === 'assistance') {
    const values = sets.map(s => s.weight || 0).filter(Boolean);
    return values.length ? Math.min(...values) : null;
  }
  if (key === 'distance') return Math.max(...sets.map(s => distanceKm(s.distance || 0, exercise.distanceUnit))) || null;
  if (key === 'pace') {
    const paces = sets.map(s => { const km = distanceKm(s.distance || 0, exercise.distanceUnit); return km > 0 && s.durationSeconds ? s.durationSeconds / 60 / km : 0; }).filter(Boolean);
    return paces.length ? Math.min(...paces) : null;
  }
  if (key === 'duration') return Math.max(...sets.map(s => (s.durationSeconds || 0) / 60)) || null;
  return null;
};

export const exerciseNames = (logs: WorkoutLog[]) => Array.from(new Set(logs.flatMap(l => l.exercises.map(e => e.exerciseName)))).sort();
