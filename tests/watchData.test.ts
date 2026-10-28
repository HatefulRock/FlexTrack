import { describe, expect, it } from 'vitest';
import { Exercise, WorkoutTemplate } from '../types';
import { buildWatchSnapshot, exerciseDetail } from '../utils/watchData';

const ex = (over: Partial<Exercise>): Exercise => ({ id: 'e', name: 'Lift', type: 'reps', targetSets: 3, targetReps: 5, ...over });

describe('watch snapshot', () => {
  it('formats each exercise target the way the app shows it', () => {
    expect(exerciseDetail(ex({ loadMode: 'external', targetWeight: 42.5 }))).toBe('3 × 5 · 42.5 kg');
    expect(exerciseDetail(ex({ loadMode: 'bodyweight' }))).toBe('3 × 5 · bodyweight');
    expect(exerciseDetail(ex({ loadMode: 'assisted', targetWeight: 20 }))).toBe('3 × 5 · 20 kg assist');
    expect(exerciseDetail(ex({ type: 'timer', targetSets: 2, targetDurationSeconds: 45 }))).toBe('2 × 45 s');
    expect(exerciseDetail(ex({ type: 'distance', targetDistance: 3.1, targetDistanceUnit: 'miles' }))).toBe('3.1 mi');
  });

  it('carries only scheduled routines, with their exercises', () => {
    const templates: WorkoutTemplate[] = [
      { id: 'a', name: 'Push', scheduleDays: [1, 4], exercises: [ex({ name: 'Bench', targetWeight: 60 })] },
      { id: 'b', name: 'Someday', scheduleDays: [], exercises: [] },
    ];
    expect(buildWatchSnapshot(templates, []).routines).toEqual([{ name: 'Push', days: [1, 4], items: [{ name: 'Bench', detail: '3 × 5 · 60 kg' }] }]);
  });
});
