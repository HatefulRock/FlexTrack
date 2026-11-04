import { describe, expect, it } from 'vitest';
import { freeActivityTemplate, withSessionDuration } from '../utils/freeActivity';
import { sanitizeTemplate } from '../utils/sanitize';
import { exerciseDetail } from '../utils/watchData';
import { logColor, CARDIO_COLOR, NEUTRAL_COLOR } from '../utils/workoutColor';
import { toHealthWorkout } from '../utils/healthWorkout';
import { WorkoutLog } from '../types';

describe('open-ended sessions', () => {
  it('builds a run with no distance target', () => {
    const t = freeActivityTemplate('run');
    expect(t.freeActivity).toBe('run');
    expect(t.exercises).toHaveLength(1);
    expect(t.exercises[0]).toMatchObject({ name: 'Run', type: 'distance', targetSets: 1, restSeconds: 0 });
    expect(t.exercises[0].targetDistance).toBeUndefined();
    expect(freeActivityTemplate('other').exercises[0].type).toBe('timer');
  });

  it('survives the session store', () => {
    expect(sanitizeTemplate(freeActivityTemplate('walk'))?.freeActivity).toBe('walk');
    expect(sanitizeTemplate({ ...freeActivityTemplate('walk'), freeActivity: 'swim' })?.freeActivity).toBeUndefined();
  });

  it('fills a missing time from the session clock, never over a typed one', () => {
    const run = { exerciseType: 'distance' as const };
    expect(withSessionDuration(run, { setNumber: 1, completed: true, distance: 5 }, 0, 1_500_000).durationSeconds).toBe(1500);
    expect(withSessionDuration(run, { setNumber: 1, completed: true, durationSeconds: 1200 }, 0, 1_500_000).durationSeconds).toBe(1200);
    expect(withSessionDuration({ exerciseType: 'reps' }, { setNumber: 1, completed: true }, 0, 1_500_000).durationSeconds).toBeUndefined();
  });

  it('shows an open routine distance on the watch as open, not 0 km', () => {
    expect(exerciseDetail({ id: 'a', name: 'Run', type: 'distance', targetDistance: 0 })).toBe('open distance');
    expect(exerciseDetail({ id: 'a', name: 'Run', type: 'distance', targetDistance: 12, targetDistanceUnit: 'km' })).toBe('12 km');
  });

  it('files the finished session as a run, for colour and for Health', () => {
    const log: WorkoutLog = {
      id: 'l', templateName: 'Run', source: 'routine', activityCategory: 'run', startTime: 0, endTime: 1_800_000,
      exercises: [{ exerciseId: 'e', exerciseName: 'Run', exerciseType: 'distance', distanceUnit: 'km', completed: true, sets: [{ setNumber: 1, completed: true, distance: 6, durationSeconds: 1800 }] }],
    };
    expect(logColor(log)).toBe(CARDIO_COLOR);
    expect(logColor({ ...log, activityCategory: 'other' })).toBe(NEUTRAL_COLOR);
    expect(toHealthWorkout(log)).toMatchObject({ activity: 'run', distanceMeters: 6000, manual: false });
  });
});
