import { Exercise, ExerciseLog, FreeActivityKind, SetLog, WorkoutTemplate } from '../types';
import { generateId } from './helpers';

// "Just go": a live session with no plan. Distance and time are whatever the lifter did, entered at the end.
export const FREE_ACTIVITIES: { kind: FreeActivityKind; label: string }[] = [
  { kind: 'run', label: 'Run' }, { kind: 'walk', label: 'Walk' }, { kind: 'cycle', label: 'Ride' }, { kind: 'other', label: 'Other' },
];

const NAMES: Record<FreeActivityKind, string> = { run: 'Run', walk: 'Walk', cycle: 'Ride', other: 'Activity' };

// A throwaway template: one open set, no targets, no rest. It is never written to the workout list.
export const freeActivityTemplate = (kind: FreeActivityKind): WorkoutTemplate => {
  const exercise: Exercise = kind === 'other'
    ? { id: generateId(), name: NAMES[kind], type: 'timer', targetSets: 1, restSeconds: 0 }
    : { id: generateId(), name: NAMES[kind], type: 'distance', targetSets: 1, targetDistanceUnit: 'km', restSeconds: 0 };
  return { id: `free-${generateId()}`, name: NAMES[kind], exercises: [exercise], freeActivity: kind };
};

// An open-ended set finished without a time typed in (or a timer run) takes the session clock, so the pace is there for free.
export const withSessionDuration = (exercise: Pick<ExerciseLog, 'exerciseType'>, set: SetLog, sessionStart: number, now = Date.now()): SetLog => {
  if (set.durationSeconds && set.durationSeconds > 0) return set;
  if (exercise.exerciseType !== 'distance' && exercise.exerciseType !== 'timer') return set;
  const seconds = Math.floor((now - sessionStart) / 1000);
  return seconds > 0 ? { ...set, durationSeconds: seconds } : set;
};
