import { Exercise, ExerciseLog, SetLog, UserProfile, WorkoutLog, WorkoutTemplate } from '../types';
import { generateId } from './helpers';

// Everything read back from storage passes through these: stored data is never trusted to match the current types.
export const MAX_TEMPLATES = 500;
export const MAX_EXERCISES = 200;
export const MAX_SETS = 100;
export const MAX_LOGS = 10_000;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const finite = (value: unknown, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const text = (value: unknown, fallback = '', maxLength = 500) =>
  typeof value === 'string' ? value.slice(0, maxLength) : fallback;

export const sanitizeExercise = (value: unknown): Exercise | null => {
  if (!isRecord(value)) return null;
  const type = value.type === 'timer' || value.type === 'distance' ? value.type : 'reps';
  const loadMode = value.loadMode === 'bodyweight' || value.loadMode === 'assisted' ? value.loadMode : 'external';
  const targetDistanceUnit = value.targetDistanceUnit === 'm' || value.targetDistanceUnit === 'miles' ? value.targetDistanceUnit : 'km';
  return {
    id: text(value.id, '', 128) || generateId(), name: text(value.name, 'Untitled exercise', 200), type,
    loadMode: type === 'reps' ? loadMode : undefined,
    targetSets: Math.round(finite(value.targetSets, 1, 1, MAX_SETS)),
    targetReps: Math.round(finite(value.targetReps, 0, 0, 100_000)),
    targetWeight: finite(value.targetWeight, 0, 0, 100_000),
    targetDurationSeconds: Math.round(finite(value.targetDurationSeconds, 0, 0, 604_800)),
    targetDistance: finite(value.targetDistance, 0, 0, 1_000_000),
    targetDistanceUnit,
    restSeconds: Math.round(finite(value.restSeconds, 60, 0, 86_400)),
    notes: text(value.notes, '', 2_000) || undefined,
  };
};

export const sanitizeTemplate = (value: unknown): WorkoutTemplate | null => {
  if (!isRecord(value)) return null;
  const exercises = Array.isArray(value.exercises)
    ? value.exercises.slice(0, MAX_EXERCISES).map(sanitizeExercise).filter((item): item is Exercise => item !== null) : [];
  const scheduleDays = Array.isArray(value.scheduleDays)
    ? Array.from(new Set(value.scheduleDays.filter(day => Number.isInteger(day) && Number(day) >= 0 && Number(day) <= 6).map(Number))).sort((a, b) => a - b) : [];
  return {
    id: text(value.id, '', 128) || generateId(), name: text(value.name, 'Untitled routine', 200),
    description: text(value.description, '', 2_000) || undefined, exercises,
    tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 50).map(tag => tag.slice(0, 100)) : undefined,
    scheduleDays,
  };
};

export const sanitizeSet = (value: unknown, index: number): SetLog | null => {
  if (!isRecord(value)) return null;
  return {
    setNumber: Math.round(finite(value.setNumber, index + 1, 1, MAX_SETS)),
    reps: finite(value.reps), weight: finite(value.weight), distance: finite(value.distance),
    durationSeconds: Math.round(finite(value.durationSeconds, 0, 0, 604_800)),
    completed: value.completed === true, notes: text(value.notes, '', 2_000) || undefined,
  };
};

export const sanitizeExerciseLog = (value: unknown): ExerciseLog | null => {
  if (!isRecord(value)) return null;
  const sets = Array.isArray(value.sets)
    ? value.sets.slice(0, MAX_SETS).map(sanitizeSet).filter((item): item is SetLog => item !== null) : [];
  const exerciseType = value.exerciseType === 'timer' || value.exerciseType === 'distance' || value.exerciseType === 'reps' ? value.exerciseType : undefined;
  const loadMode = value.loadMode === 'external' || value.loadMode === 'bodyweight' || value.loadMode === 'assisted' ? value.loadMode : undefined;
  const distanceUnit = value.distanceUnit === 'm' || value.distanceUnit === 'km' || value.distanceUnit === 'miles' ? value.distanceUnit : undefined;
  return {
    exerciseId: text(value.exerciseId, '', 128) || generateId(), exerciseName: text(value.exerciseName, 'Untitled exercise', 200),
    exerciseType, loadMode, distanceUnit, sets, completed: value.completed === true,
  };
};

export const sanitizeLog = (value: unknown): WorkoutLog | null => {
  if (!isRecord(value)) return null;
  const startTime = finite(value.startTime);
  if (!startTime) return null;
  const exercises = Array.isArray(value.exercises)
    ? value.exercises.slice(0, MAX_EXERCISES).map(sanitizeExerciseLog).filter((item): item is ExerciseLog => item !== null) : [];
  const categories = ['strength', 'run', 'walk', 'cycle', 'timed', 'other'];
  return {
    id: text(value.id, '', 128) || generateId(), templateId: text(value.templateId, '', 128) || undefined,
    templateName: text(value.templateName, 'Workout', 200), source: value.source === 'quick' ? 'quick' : 'routine',
    activityCategory: typeof value.activityCategory === 'string' && categories.includes(value.activityCategory)
      ? value.activityCategory as WorkoutLog['activityCategory'] : undefined,
    notes: text(value.notes, '', 2_000) || undefined, startTime,
    endTime: finite(value.endTime, startTime, startTime), exercises,
  };
};

export const sanitizeProfile = (value: unknown): UserProfile => {
  if (!isRecord(value)) return { weightLogs: [], height: 0 };
  const weightLogs = Array.isArray(value.weightLogs) ? value.weightLogs.slice(-MAX_LOGS).flatMap(entry => {
    if (!isRecord(entry)) return [];
    const date = finite(entry.date);
    const weight = finite(entry.weight, 0, 0, 2_000);
    return date && weight ? [{ date, weight }] : [];
  }).sort((a, b) => a.date - b.date) : [];
  return { height: finite(value.height, 0, 0, 300), weightLogs };
};
