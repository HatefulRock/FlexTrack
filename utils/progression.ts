import { Exercise, ExerciseLog } from '../types';
import { formatKg } from './training';

export interface ProgressionSuggestion { weight?: number; reps: number; reason: string; }

export const PROGRESSION_STEP_KG = 2.5;

// Double progression. Every working set last session done at the routine's target reps (or more) earns the next step:
// +2.5 kg on external load, one more rep than last time's weakest set on bodyweight, 2.5 kg less than the least assistance used. A missed set holds: null, and the
// lifter repeats last time's values. Timer and distance work never get a suggestion.
export const suggestProgression = (exercise: Exercise, last?: ExerciseLog | null): ProgressionSuggestion | null => {
  if (exercise.type !== 'reps' || !last?.sets.length) return null;
  const target = Math.floor(exercise.targetReps ?? 0);
  if (target <= 0) return null;
  const hitAll = last.sets.every(s => s.completed && (s.reps ?? 0) >= target);
  if (!hitAll) return null;
  const sets = last.sets.length;
  const mode = exercise.loadMode || 'external';

  if (mode === 'bodyweight') {
    const floor = Math.min(...last.sets.map(s => Math.floor(s.reps ?? 0)));
    return { reps: floor + 1, reason: `All sets hit ${floor} reps` };
  }

  const weights = last.sets.map(s => (typeof s.weight === 'number' && Number.isFinite(s.weight) ? s.weight : 0));
  if (mode === 'assisted') {
    const least = Math.min(...weights);
    if (least <= 0) return null;
    return { weight: Math.max(0, Math.round((least - PROGRESSION_STEP_KG) * 100) / 100), reps: target, reason: `You hit ${sets} × ${target} with ${formatKg(least)} assist last time` };
  }
  const top = Math.max(...weights);
  if (top <= 0) return null;
  return { weight: Math.round((top + PROGRESSION_STEP_KG) * 100) / 100, reps: target, reason: `You hit ${sets} × ${target} at ${formatKg(top)} last time` };
};
