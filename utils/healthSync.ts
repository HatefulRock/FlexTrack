import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutLog } from '../types';
import { toHealthWorkout, HealthWorkout } from './healthWorkout';
import { healthPlatform } from './healthPlatform';

const KEY = 'health-sync';

export const loadHealthSyncEnabled = async () => {
  try { return (await AsyncStorage.getItem(KEY)) === 'on'; } catch { return false; }
};
export const saveHealthSyncEnabled = (enabled: boolean) => AsyncStorage.setItem(KEY, enabled ? 'on' : 'off');

// Sends finished sessions to the device's health store. Sessions too short to be a workout are left out.
export const sendToHealth = async (logs: WorkoutLog[]) => {
  if (!healthPlatform) throw new Error('No health platform on this device');
  const workouts = logs.map(toHealthWorkout).filter((w): w is HealthWorkout => w !== null);
  await healthPlatform.saveWorkouts(workouts);
  return { sent: workouts.length, skipped: logs.length - workouts.length };
};
