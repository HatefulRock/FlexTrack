import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExerciseLog, WorkoutTemplate } from '../types';
import { isRecord, sanitizeExerciseLog, sanitizeTemplate } from './sanitize';

// The in-progress workout, written on every change so a reload or app kill never loses a session.
export interface ActiveSession {
  template: WorkoutTemplate;
  startTime: number;
  activeExerciseIndex: number;
  logs: ExerciseLog[];
  savedAt: number;
}

const KEY = 'active-session';
const MAX_AGE = 12 * 60 * 60 * 1000;

export const saveActiveSession = (session: Omit<ActiveSession, 'savedAt'>) =>
  AsyncStorage.setItem(KEY, JSON.stringify({ ...session, savedAt: Date.now() })).catch(() => undefined);

export const clearActiveSession = () => AsyncStorage.removeItem(KEY).catch(() => undefined);

// A stored session is only resumable when it is recent and, after the same sanitizing as the main store,
// every exercise in its template still has a matching log. Anything else is discarded rather than crashing the dashboard.
const toResumable = (value: unknown): ActiveSession | null => {
  if (!isRecord(value) || typeof value.startTime !== 'number' || !Number.isFinite(value.startTime)
    || typeof value.savedAt !== 'number' || !(Date.now() - value.savedAt < MAX_AGE)) return null;
  const template = sanitizeTemplate(value.template);
  const logs = Array.isArray(value.logs) ? value.logs.map(sanitizeExerciseLog) : [];
  if (!template || !template.exercises.length || logs.length !== template.exercises.length || logs.some(log => log === null)) return null;
  const saved = value.activeExerciseIndex;
  const index = typeof saved === 'number' && Number.isInteger(saved) ? saved : 0;
  return {
    template, startTime: value.startTime, savedAt: value.savedAt, logs: logs as ExerciseLog[],
    activeExerciseIndex: Math.max(0, Math.min(index, logs.length - 1)),
  };
};

export const loadActiveSession = async (): Promise<ActiveSession | null> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw || raw.length > 2_000_000) return null;
    const session = toResumable(JSON.parse(raw) as unknown);
    if (!session) await clearActiveSession();
    return session;
  } catch { await clearActiveSession(); return null; }
};
