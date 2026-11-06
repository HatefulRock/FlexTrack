import { Exercise, ExerciseLog } from '../types';
import { addInUnit, formatWeight, weightStep } from './units';

export interface ProgressionSuggestion { weight?: number; reps: number; reason: string; }

// Double progression. Every working set last session done at the routine's target reps (or more) earns the next step:
// one step on external load (+2.5 kg, or +5 lb for a lifter in pounds), one more rep than last time's weakest set on
// bodyweight, one step less than the least assistance used. Weights stay in kilograms; the step is taken in the
// lifter's unit so the suggestion is a load they can put on the bar. A missed set holds: null, and the lifter repeats
// last time's values. Timer and distance work never get a suggestion.
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
    return { weight: addInUnit(least, -weightStep()), reps: target, reason: `You hit ${sets} × ${target} with ${formatWeight(least)} assist last time` };
  }
  const top = Math.max(...weights);
  if (top <= 0) return null;
  return { weight: addInUnit(top, weightStep()), reps: target, reason: `You hit ${sets} × ${target} at ${formatWeight(top)} last time` };
};
