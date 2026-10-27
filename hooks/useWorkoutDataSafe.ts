import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise, ExerciseLog, SetLog, UserProfile, WorkoutLog, WorkoutTemplate } from '../types';
import { generateId } from '../utils/helpers';

const KEYS = { templates: 'workout-templates', logs: 'workout-logs', profile: 'user-profile' } as const;
const MAX_STORED_CHARACTERS = 5_000_000;
const MAX_TEMPLATES = 500;
const MAX_EXERCISES = 200;
const MAX_SETS = 100;
const MAX_LOGS = 10_000;

// First run gets one complete, startable routine instead of an empty example.
const STARTER_TEMPLATES: WorkoutTemplate[] = [{
  id: 'starter-full-body', name: 'Full Body A', description: 'Three compound lifts and a plank. Edit the weights to match you.', scheduleDays: [],
  exercises: [
    { id: 'starter-squat', name: 'Back Squat', type: 'reps', loadMode: 'external', targetSets: 3, targetReps: 5, targetWeight: 40, restSeconds: 150 },
    { id: 'starter-bench', name: 'Bench Press', type: 'reps', loadMode: 'external', targetSets: 3, targetReps: 5, targetWeight: 30, restSeconds: 120 },
    { id: 'starter-row', name: 'Barbell Row', type: 'reps', loadMode: 'external', targetSets: 3, targetReps: 8, targetWeight: 30, restSeconds: 90 },
    { id: 'starter-plank', name: 'Plank', type: 'timer', targetSets: 2, targetDurationSeconds: 45, restSeconds: 60 },
  ],
}];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const finite = (value: unknown, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const text = (value: unknown, fallback = '', maxLength = 500) =>
  typeof value === 'string' ? value.slice(0, maxLength) : fallback;
const parseStored = (value: string | null): unknown => {
  if (value === null || value.length > MAX_STORED_CHARACTERS) return undefined;
  try { return JSON.parse(value) as unknown; } catch { return undefined; }
};

const sanitizeExercise = (value: unknown): Exercise | null => {
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

const sanitizeTemplate = (value: unknown): WorkoutTemplate | null => {
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

const sanitizeSet = (value: unknown, index: number): SetLog | null => {
  if (!isRecord(value)) return null;
  return {
    setNumber: Math.round(finite(value.setNumber, index + 1, 1, MAX_SETS)),
    reps: finite(value.reps), weight: finite(value.weight), distance: finite(value.distance),
    durationSeconds: Math.round(finite(value.durationSeconds, 0, 0, 604_800)),
    completed: value.completed === true, notes: text(value.notes, '', 2_000) || undefined,
  };
};

const sanitizeExerciseLog = (value: unknown): ExerciseLog | null => {
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

const sanitizeLog = (value: unknown): WorkoutLog | null => {
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

const sanitizeProfile = (value: unknown): UserProfile => {
  if (!isRecord(value)) return { weightLogs: [], height: 0 };
  const weightLogs = Array.isArray(value.weightLogs) ? value.weightLogs.slice(-MAX_LOGS).flatMap(entry => {
    if (!isRecord(entry)) return [];
    const date = finite(entry.date);
    const weight = finite(entry.weight, 0, 0, 2_000);
    return date && weight ? [{ date, weight }] : [];
  }).sort((a, b) => a.date - b.date) : [];
  return { height: finite(value.height, 0, 0, 300), weightLogs };
};

export const useWorkoutData = () => {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [userProfile, setUserProfileState] = useState<UserProfile>({ weightLogs: [], height: 0 });
  const [loading, setLoading] = useState(true);
  const templateRef = useRef<WorkoutTemplate[]>([]);
  const logRef = useRef<WorkoutLog[]>([]);
  const writeQueue = useRef<Record<string, Promise<void>>>({});
  // When the initial read fails, the stored data is unknown: refuse writes rather than overwrite it with defaults.
  const loadFailed = useRef(false);

  const persist = useCallback((key: string, value: unknown) => {
    if (loadFailed.current) return Promise.reject(new Error('Local storage could not be read'));
    const previous = writeQueue.current[key] ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(() => AsyncStorage.setItem(key, JSON.stringify(value)));
    writeQueue.current[key] = next;
    return next;
  }, []);

  useEffect(() => {
    let mounted = true;
    void Promise.all([AsyncStorage.getItem(KEYS.templates), AsyncStorage.getItem(KEYS.logs), AsyncStorage.getItem(KEYS.profile)])
      .then(([storedTemplates, storedLogs, storedProfile]) => {
        if (!mounted) return;
        const parsedTemplates = parseStored(storedTemplates);
        const nextTemplates = Array.isArray(parsedTemplates)
          ? parsedTemplates.slice(0, MAX_TEMPLATES).map(sanitizeTemplate).filter((item): item is WorkoutTemplate => item !== null)
          : storedTemplates === null ? STARTER_TEMPLATES : [];
        const parsedLogs = parseStored(storedLogs);
        const nextLogs = Array.isArray(parsedLogs)
          ? parsedLogs.slice(-MAX_LOGS).map(sanitizeLog).filter((item): item is WorkoutLog => item !== null) : [];
        templateRef.current = nextTemplates; logRef.current = nextLogs;
        setTemplates(nextTemplates); setLogs(nextLogs); setUserProfileState(sanitizeProfile(parseStored(storedProfile)));
      })
      .catch(() => {
        if (!mounted) return;
        loadFailed.current = true;
        const defaults = STARTER_TEMPLATES;
        templateRef.current = defaults;
        logRef.current = [];
        setTemplates(defaults);
        setLogs([]);
        setUserProfileState({ weightLogs: [], height: 0 });
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const saveTemplate = useCallback((template: WorkoutTemplate) => {
    const sanitized = sanitizeTemplate(template);
    if (!sanitized) return Promise.reject(new Error('Invalid workout template'));
    const current = templateRef.current;
    const next = current.some(item => item.id === sanitized.id)
      ? current.map(item => item.id === sanitized.id ? sanitized : item) : [...current, sanitized];
    templateRef.current = next; setTemplates(next);
    return persist(KEYS.templates, next);
  }, [persist]);
  const deleteTemplate = useCallback((id: string) => {
    const next = templateRef.current.filter(template => template.id !== id);
    templateRef.current = next; setTemplates(next);
    return persist(KEYS.templates, next);
  }, [persist]);
  const addLog = useCallback((log: WorkoutLog) => {
    const sanitized = sanitizeLog(log);
    if (!sanitized) return Promise.reject(new Error('Invalid workout log'));
    const next = [...logRef.current, sanitized].slice(-MAX_LOGS);
    logRef.current = next; setLogs(next);
    return persist(KEYS.logs, next);
  }, [persist]);
  const setUserProfile = useCallback((profile: UserProfile) => {
    const sanitized = sanitizeProfile(profile);
    setUserProfileState(sanitized);
    return persist(KEYS.profile, sanitized);
  }, [persist]);

  return { templates, logs, userProfile, loading, saveTemplate, deleteTemplate, addLog, setUserProfile };
};
