import { describe, expect, it } from 'vitest';
import { suggestProgression } from '../utils/progression';
import { Exercise, ExerciseLog, SetLog } from '../types';

const exercise = (over: Partial<Exercise> = {}): Exercise =>
  ({ id: 'e1', name: 'Bench Press', type: 'reps', loadMode: 'external', targetSets: 3, targetReps: 5, targetWeight: 60, restSeconds: 90, ...over });
const sets = (rows: [number, number, boolean?][]): SetLog[] =>
  rows.map(([weight, reps, completed = true], i) => ({ setNumber: i + 1, weight, reps, completed }));
const last = (rows: [number, number, boolean?][]): ExerciseLog => ({ exerciseId: 'e1', exerciseName: 'Bench Press', sets: sets(rows), completed: true });

describe('suggestProgression', () => {
  it('adds 2.5 kg to the heaviest set when every set hit target', () => {
    expect(suggestProgression(exercise(), last([[60, 5], [60, 5], [62.5, 6]]))).toMatchObject({ weight: 65, reps: 5 });
  });

  it('holds when a set missed reps or was not completed', () => {
    expect(suggestProgression(exercise(), last([[60, 5], [60, 4]]))).toBeNull();
    expect(suggestProgression(exercise(), last([[60, 5], [60, 5, false]]))).toBeNull();
  });

  it('adds one rep over the weakest set on bodyweight work', () => {
    expect(suggestProgression(exercise({ loadMode: 'bodyweight' }), last([[0, 8], [0, 4]]))).toBeNull();
    expect(suggestProgression(exercise({ loadMode: 'bodyweight', targetReps: 6 }), last([[0, 8], [0, 6]]))).toMatchObject({ reps: 7 });
  });

  it('takes 2.5 kg off the least assistance used, never below zero', () => {
    expect(suggestProgression(exercise({ loadMode: 'assisted' }), last([[20, 5], [15, 5]]))).toMatchObject({ weight: 12.5 });
    expect(suggestProgression(exercise({ loadMode: 'assisted' }), last([[1.25, 5]]))).toMatchObject({ weight: 0 });
  });

  it('never suggests for timed work or without history', () => {
    expect(suggestProgression(exercise({ type: 'timer' }), last([[0, 5]]))).toBeNull();
    expect(suggestProgression(exercise(), null)).toBeNull();
  });
});
