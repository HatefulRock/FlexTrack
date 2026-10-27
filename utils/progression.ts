import { Exercise, ExerciseLog } from '../types';

export interface ProgressionSuggestion { weight?: number; reps: number; reason: string; }

export const PROGRESSION_STEP_KG = 2.5;

const kg = (v: number) => `${Number.isInteger(v) ? v : Math.round(v * 100) / 100} kg`;

// Double progression. Every working set last session done at the routine's target reps (or more) earns the next step:
// +2.5 kg on external load, one more rep on bodyweight, 2.5 kg less assistance. A missed set holds: null, and the
// lifter repeats last time's values. Timer and distance work never get a suggestion.
export const suggestProgression = (exercise: Exercise, last?: ExerciseLog | null): ProgressionSuggestion | null => {
  if (exercise.type !== 'reps' || !last?.sets.length) return null;
  const target = Math.floor(exercise.targetReps ?? 0);
  if (target <= 0) return null;
  const hitAll = last.sets.every(s => s.completed && (s.reps ?? 0) >= target);
  if (!hitAll) return null;
  const sets = last.sets.length;
  const mode = exercise.loadMode || 'external';

  if (mode === 'bodyweight') return { reps: target + 1, reason: `All sets hit ${target} reps` };

  const top = Math.max(...last.sets.map(s => (typeof s.weight === 'number' && Number.isFinite(s.weight) ? s.weight : 0)));
  if (mode === 'assisted') {
    if (top <= 0) return null;
    return { weight: Math.max(0, Math.round((top - PROGRESSION_STEP_KG) * 100) / 100), reps: target, reason: `You hit ${sets} × ${target} with ${kg(top)} assist last time` };
  }
  if (top <= 0) return null;
  return { weight: Math.round((top + PROGRESSION_STEP_KG) * 100) / 100, reps: target, reason: `You hit ${sets} × ${target} at ${kg(top)} last time` };
};
