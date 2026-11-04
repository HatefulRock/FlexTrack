
export type ExerciseType = 'reps' | 'timer' | 'distance';
export type LoadMode = 'external' | 'bodyweight' | 'assisted';
export type ActivityCategory = 'strength' | 'run' | 'walk' | 'cycle' | 'timed' | 'other';

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  loadMode?: LoadMode;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number; // in kg or lbs
  targetDurationSeconds?: number;
  targetDistance?: number;
  targetDistanceUnit?: 'm' | 'km' | 'miles';
  restSeconds?: number; // Rest time between sets
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: Exercise[];
  tags?: string[];
  scheduleDays?: number[]; // Array of 0-6 (Sun-Sat). Empty = no schedule.
  color?: string; // a WORKOUT_COLORS key the lifter picked; unset falls back to a stable default
  freeActivity?: FreeActivityKind; // set only on the throwaway template behind an open-ended session; never saved as a workout
}

export type FreeActivityKind = 'run' | 'walk' | 'cycle' | 'other';

export interface SetLog {
  setNumber: number;
  reps?: number;
  weight?: number;
  distance?: number;
  durationSeconds?: number; // For splits or timed intervals
  completed: boolean;
  notes?: string;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  exerciseType?: ExerciseType;
  loadMode?: LoadMode;
  distanceUnit?: 'm' | 'km' | 'miles';
  sets: SetLog[];
  durationSeconds?: number; // For timed exercises
  completed: boolean;
}

export interface WorkoutLog {
  id: string;
  templateId?: string;
  templateName: string;
  source?: 'routine' | 'quick';
  activityCategory?: ActivityCategory;
  color?: string; // the workout's colour when the session was logged
  notes?: string;
  startTime: number;
  endTime?: number;
  exercises: ExerciseLog[];
}

export interface BodyMetricLog {
  date: number; // timestamp
  weight: number; // kg
}

export interface UserProfile {
  height?: number; // cm
  weightLogs: BodyMetricLog[];
}

export type ViewState = 'dashboard' | 'quick-log' | 'templates' | 'active-workout' | 'workout-summary' | 'history' | 'stats';

