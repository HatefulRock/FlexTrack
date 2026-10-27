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

export const loadActiveSession = async (): Promise<ActiveSession | null> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw || raw.length > 2_000_000) return null;
    const value = JSON.parse(raw) as Partial<ActiveSession>;
    const valid = value && typeof value.startTime === 'number' && typeof value.savedAt === 'number'
      && value.template && Array.isArray(value.template.exercises) && Array.isArray(value.logs)
      && value.logs.length === value.template.exercises.length && Date.now() - value.savedAt < MAX_AGE;
    if (!valid) { await clearActiveSession(); return null; }
    return { ...value, activeExerciseIndex: Math.min(Math.max(0, value.activeExerciseIndex ?? 0), value.logs!.length - 1) } as ActiveSession;
  } catch { return null; }
};
