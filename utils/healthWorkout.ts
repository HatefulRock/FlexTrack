import { ExerciseLog, WorkoutLog } from '../types';

// What FlexTrack hands to Apple Health or Health Connect: one workout per session, nothing else.
export type HealthActivity = 'strength' | 'run' | 'walk' | 'cycle' | 'other';

export interface HealthWorkout {
  id: string; // the log id, used by both platforms to skip a workout they already have
  activity: HealthActivity;
  title: string;
  start: Date;
  end: Date;
  distanceMeters?: number;
  manual: boolean; // typed in afterwards rather than tracked live
}

// Both platforms reject a workout that ends where it starts, and a quick log without a duration does.
const MIN_DURATION_MS = 60_000;

const toMeters = (value: number, unit: ExerciseLog['distanceUnit']) =>
  unit === 'm' ? value : unit === 'miles' ? value * 1609.344 : value * 1000;

export const healthActivity = (log: WorkoutLog): HealthActivity => {
  switch (log.activityCategory) {
    case 'run': case 'walk': case 'cycle': case 'strength': return log.activityCategory;
    case 'timed': case 'other': return 'other';
    default: return log.source === 'quick' ? 'other' : 'strength';
  }
};

export const loggedDistanceMeters = (log: WorkoutLog) => log.exercises.reduce((total, exercise) =>
  total + exercise.sets.reduce((sum, set) => set.completed && set.distance ? sum + toMeters(set.distance, exercise.distanceUnit) : sum, 0), 0);

export const toHealthWorkout = (log: WorkoutLog): HealthWorkout | null => {
  const end = log.endTime ?? log.startTime;
  if (end - log.startTime < MIN_DURATION_MS) return null;
  const activity = healthActivity(log);
  const distance = activity === 'strength' ? 0 : Math.round(loggedDistanceMeters(log));
  return {
    id: log.id, activity, title: log.templateName,
    start: new Date(log.startTime), end: new Date(end),
    distanceMeters: distance > 0 ? distance : undefined, manual: log.source === 'quick',
  };
};

export interface HealthPlatform {
  name: string;
  isAvailable: () => Promise<boolean>;
  // Asks for write access to workouts only; FlexTrack never reads health data.
  requestAccess: () => Promise<boolean>;
  saveWorkouts: (workouts: HealthWorkout[]) => Promise<void>;
}
