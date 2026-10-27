import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExerciseLog, WorkoutTemplate } from '../types';

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

// A stored session is only resumable when every exercise in its template has a matching log, and it is recent.
const isResumable = (value: Partial<ActiveSession> | null): value is Omit<ActiveSession, 'activeExerciseIndex'> & Partial<ActiveSession> =>
  !!value && typeof value.startTime === 'number' && typeof value.savedAt === 'number'
  && !!value.template && Array.isArray(value.template.exercises)
  && Array.isArray(value.logs) && value.logs.length === value.template.exercises.length
  && Date.now() - value.savedAt < MAX_AGE;

export const loadActiveSession = async (): Promise<ActiveSession | null> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw || raw.length > 2_000_000) return null;
    const value = JSON.parse(raw) as Partial<ActiveSession> | null;
    if (!isResumable(value)) { await clearActiveSession(); return null; }
    const saved = value.activeExerciseIndex;
    const index = typeof saved === 'number' && Number.isInteger(saved) ? saved : 0;
    return { ...value, activeExerciseIndex: Math.max(0, Math.min(index, value.logs.length - 1)) };
  } catch { return null; }
};
