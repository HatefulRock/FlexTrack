import React from 'react';
import { View } from 'react-native';
import { differenceInCalendarDays } from 'date-fns';
import { Exercise, WorkoutLog, WorkoutTemplate } from '../../types';
import { workoutColor } from '../../utils/workoutColor';

const LIFT_SET_SECONDS = 40;
const SECONDS_PER_KM = 360;
const DEFAULT_REST_SECONDS = 60; // what an active session uses when an exercise has no rest set
const KM_PER_MILE = 1.609344;

export const setCount = (e: Exercise) => Math.max(1, e.targetSets || 1);
export const exerciseCount = (n: number) => `${n} ${n === 1 ? 'exercise' : 'exercises'}`;

const targetKm = (e: Exercise) => {
  const d = e.targetDistance || 0;
  return e.targetDistanceUnit === 'm' ? d / 1000 : e.targetDistanceUnit === 'miles' ? d * KM_PER_MILE : d;
};

// Work per set: ~40 s for a lift, the target time for a timed set, ~6 min/km for distance.
const workSeconds = (e: Exercise) => {
  if (e.type === 'timer') return e.targetDurationSeconds || LIFT_SET_SECONDS;
  if (e.type === 'distance') { const km = targetKm(e); return km > 0 ? km * SECONDS_PER_KM : LIFT_SET_SECONDS; }
  return LIFT_SET_SECONDS;
};

// Work plus the prescribed rest for every set, rounded to the nearest 5 minutes.
export const estimateMinutes = (t: WorkoutTemplate) => {
  const seconds = t.exercises.reduce((sum, e) => sum + setCount(e) * ((e.restSeconds ?? DEFAULT_REST_SECONDS) + workSeconds(e)), 0);
  return Math.max(5, Math.round(seconds / 300) * 5);
};
export const routineSummary = (t: WorkoutTemplate) =>
  `${exerciseCount(t.exercises.length)}${t.exercises.length ? ` · ~${estimateMinutes(t)} min` : ''}`;

export const relativeDay = (time: number, now = new Date()) => {
  const d = differenceInCalendarDays(now, new Date(time));
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`;
};
export const lastDone = (t: WorkoutTemplate, logs: WorkoutLog[]) =>
  logs.reduce<number | null>((best, l) => l.templateId === t.id && (best === null || l.startTime > best) ? l.startTime : best, null);

// The workout's own colour, as a bar: what the lifter recognises a session by.
export const WorkoutBar = ({ template, height = 10, width = '100%' }: { template: Pick<WorkoutTemplate, 'id' | 'color'>; height?: number; width?: `${number}%` | number }) =>
  <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height, width, borderRadius: height >= 8 ? 3 : 2, backgroundColor: workoutColor(template) }} />;
