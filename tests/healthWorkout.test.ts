import { describe, expect, it } from 'vitest';
import { WorkoutLog } from '../types';
import { healthActivity, toHealthWorkout } from '../utils/healthWorkout';

const start = Date.UTC(2026, 9, 28, 7);
const log = (over: Partial<WorkoutLog>): WorkoutLog => ({ id: 'a', templateName: 'Full Body A', startTime: start, endTime: start + 45 * 60_000, exercises: [], ...over });

describe('toHealthWorkout', () => {
  it('sends a routine as a strength workout with its times and name', () => {
    expect(toHealthWorkout(log({ source: 'routine' }))).toEqual({
      id: 'a', activity: 'strength', title: 'Full Body A', start: new Date(start), end: new Date(start + 45 * 60_000), distanceMeters: undefined, manual: false,
    });
  });

  it('sums completed distance in meters for runs, walks and rides', () => {
    const run = log({ source: 'quick', activityCategory: 'run', exercises: [
      { exerciseId: 'r', exerciseName: 'Run', exerciseType: 'distance', distanceUnit: 'km', completed: true, sets: [
        { setNumber: 1, distance: 5, completed: true }, { setNumber: 2, distance: 2, completed: false }] },
      { exerciseId: 'w', exerciseName: 'Cool down', exerciseType: 'distance', distanceUnit: 'miles', completed: true, sets: [{ setNumber: 1, distance: 1, completed: true }] },
    ] });
    expect(toHealthWorkout(run)).toMatchObject({ activity: 'run', distanceMeters: 6609, manual: true });
  });

  it('leaves out sessions without a real duration', () => {
    expect(toHealthWorkout(log({ endTime: start }))).toBeNull();
    expect(toHealthWorkout(log({ endTime: undefined }))).toBeNull();
  });

  it('never puts distance on a strength workout', () => {
    const lifts = log({ exercises: [{ exerciseId: 's', exerciseName: 'Sled push', exerciseType: 'distance', distanceUnit: 'm', completed: true, sets: [{ setNumber: 1, distance: 40, completed: true }] }] });
    expect(toHealthWorkout(lifts)?.distanceMeters).toBeUndefined();
  });

  it('maps categories to health activity types', () => {
    expect(healthActivity(log({ activityCategory: 'cycle' }))).toBe('cycle');
    expect(healthActivity(log({ activityCategory: 'timed' }))).toBe('other');
    expect(healthActivity(log({ source: 'quick' }))).toBe('other');
  });
});
