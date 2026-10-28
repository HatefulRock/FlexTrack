import { ExerciseType, getGrantedPermissions, getSdkStatus, initialize, insertRecords, RecordingMethod, requestPermission, SdkAvailabilityStatus } from 'react-native-health-connect';
import { HealthActivity, HealthPlatform, HealthWorkout } from './healthWorkout';

const EXERCISE: Record<HealthActivity, number> = {
  strength: ExerciseType.STRENGTH_TRAINING,
  run: ExerciseType.RUNNING,
  walk: ExerciseType.WALKING,
  cycle: ExerciseType.BIKING,
  other: ExerciseType.OTHER_WORKOUT,
};

let ready: Promise<boolean> | null = null;
const ensureReady = () => (ready ??= initialize().catch(() => { ready = null; return false; }));

// Same client record id and version: Health Connect updates the copy it has instead of adding another.
const metadata = (workout: HealthWorkout, kind: string) => ({
  clientRecordId: `flextrack-${kind}-${workout.id}`, clientRecordVersion: 1,
  recordingMethod: workout.manual ? RecordingMethod.RECORDING_METHOD_MANUAL_ENTRY : RecordingMethod.RECORDING_METHOD_ACTIVELY_RECORDED,
});

// Keeps a large first sync within the size Health Connect accepts in one call.
const inChunks = async <T,>(items: T[], write: (chunk: T[]) => Promise<unknown>) => {
  for (let i = 0; i < items.length; i += 100) await write(items.slice(i, i + 100));
};

const canWriteDistance = async () =>
  (await getGrantedPermissions()).some(p => 'recordType' in p && p.recordType === 'Distance' && p.accessType === 'write');

export const healthPlatform: HealthPlatform = {
  name: 'Health Connect',
  isAvailable: async () => (await getSdkStatus().catch(() => 0)) === SdkAvailabilityStatus.SDK_AVAILABLE && ensureReady(),
  requestAccess: async () => {
    if (!(await ensureReady())) return false;
    const granted = await requestPermission([{ accessType: 'write', recordType: 'ExerciseSession' }, { accessType: 'write', recordType: 'Distance' }]);
    return granted.some(p => 'recordType' in p && p.recordType === 'ExerciseSession' && p.accessType === 'write');
  },
  saveWorkouts: async workouts => {
    if (!workouts.length) return;
    if (!(await ensureReady())) throw new Error('Health Connect is not available');
    await inChunks(workouts, chunk => insertRecords(chunk.map(w => ({
      recordType: 'ExerciseSession' as const, exerciseType: EXERCISE[w.activity], title: w.title,
      startTime: w.start.toISOString(), endTime: w.end.toISOString(), metadata: metadata(w, 'session'),
    }))));
    const withDistance = workouts.filter(w => w.distanceMeters);
    // Distance is optional: the user can grant workouts and leave distance off.
    if (!withDistance.length || !(await canWriteDistance())) return;
    await inChunks(withDistance, chunk => insertRecords(chunk.map(w => ({
      recordType: 'Distance' as const, distance: { value: w.distanceMeters!, unit: 'meters' as const },
      startTime: w.start.toISOString(), endTime: w.end.toISOString(), metadata: metadata(w, 'distance'),
    }))));
  },
};
