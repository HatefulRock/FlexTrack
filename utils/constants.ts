import { WorkoutTemplate } from '../types';

export const DEFAULT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'daily-stretch',
    name: 'Daily Stretch',
    description: 'Morning mobility routine to wake up the body.',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6], // Every day
    exercises: [
      { id: 's1', name: 'Cat-Cow', type: 'reps', targetSets: 1, targetReps: 20, notes: 'Slow movement, focus on spine', restSeconds: 0 },
      { id: 's2', name: 'Hamstring Stretch', type: 'timer', targetDurationSeconds: 45, notes: 'Hold each leg', restSeconds: 10 },
      { id: 's3', name: 'Deep Squat Hold', type: 'timer', targetDurationSeconds: 60, notes: 'Keep heels on ground', restSeconds: 10 }
    ]
  },
  {
    id: 'monday-workout',
    name: 'Monday Push',
    description: 'Start the week strong with Upper Body.',
    scheduleDays: [1], // Monday
    exercises: [
      { id: 'e1', name: 'Push Ups', type: 'reps', targetSets: 3, targetReps: 15, targetWeight: 0, restSeconds: 60, notes: 'Chest to floor' },
      { id: 'e2', name: 'Dumbbell Press', type: 'reps', targetSets: 3, targetReps: 10, targetWeight: 20, restSeconds: 90 },
      { id: 'e3', name: 'Plank', type: 'timer', targetDurationSeconds: 60, notes: 'Core tight', restSeconds: 60 }
    ]
  },
  {
    id: 'running-intervals',
    name: 'Interval Run',
    description: 'High intensity interval training.',
    scheduleDays: [3, 6], // Wed, Sat
    exercises: [
        { id: 'r1', name: 'Warmup Jog', type: 'distance', targetSets: 1, targetDistance: 1, targetDistanceUnit: 'km', notes: 'Easy pace', restSeconds: 60 },
        { id: 'r2', name: '400m Sprints', type: 'distance', targetSets: 6, targetDistance: 400, targetDistanceUnit: 'm', restSeconds: 120, notes: 'Max effort' }
    ]
  }
];