import { isHealthDataAvailableAsync, requestAuthorization, saveWorkoutSample, WorkoutActivityType } from '@kingstinct/react-native-healthkit';
import { HealthActivity, HealthPlatform } from './healthWorkout';

const ACTIVITY: Record<HealthActivity, WorkoutActivityType> = {
  strength: WorkoutActivityType.traditionalStrengthTraining,
  run: WorkoutActivityType.running,
  walk: WorkoutActivityType.walking,
  cycle: WorkoutActivityType.cycling,
  other: WorkoutActivityType.other,
};

export const healthPlatform: HealthPlatform = {
  name: 'Apple Health',
  isAvailable: () => isHealthDataAvailableAsync(),
  // iOS never says whether write access was granted; a denied save fails in saveWorkouts instead.
  requestAccess: () => requestAuthorization({ toShare: ['HKWorkoutTypeIdentifier'] }),
  saveWorkouts: async workouts => {
    for (const workout of workouts) {
      // Same sync identifier and version: Health keeps the copy it already has instead of adding another.
      await saveWorkoutSample(ACTIVITY[workout.activity], [], workout.start, workout.end,
        workout.distanceMeters ? { distance: workout.distanceMeters } : undefined,
        { HKMetadataKeySyncIdentifier: `flextrack-${workout.id}`, HKMetadataKeySyncVersion: 1 });
    }
  },
};
