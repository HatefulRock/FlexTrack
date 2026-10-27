import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { differenceInCalendarDays } from 'date-fns';
import { Exercise, WorkoutLog, WorkoutTemplate } from '../../types';
import { CATEGORY_LABEL, Category, categoryColor, exerciseCategory } from '../../utils/training';
import { theme } from '../../constants/theme';
import { CATEGORY_ORDER } from '../History/historyModel';

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

const segments = (exercises: Exercise[]) => exercises.map(e => ({ id: e.id, category: exerciseCategory(e.name, e.type), sets: setCount(e) }));

// The session's shape: one segment per exercise, width = sets, hue = training category.
export const CategoryStrip = ({ exercises, height = 10 }: { exercises: Exercise[]; height?: number }) => {
  const segs = segments(exercises);
  if (!segs.length) return <View style={[styles.strip, { height }, styles.emptyStrip]} />;
  return <View style={[styles.strip, { height, gap: height >= 8 ? 3 : 2 }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {segs.map((s, i) => <View key={`${s.id}-${i}`} style={{ flex: s.sets, backgroundColor: categoryColor(s.category), borderRadius: height >= 8 ? 2 : 1 }} />)}
  </View>;
};

export const CategoryLegend = ({ exercises }: { exercises: Exercise[] }) => {
  const sets = segments(exercises).reduce<Partial<Record<Category, number>>>((acc, s) => ({ ...acc, [s.category]: (acc[s.category] || 0) + s.sets }), {});
  const present = CATEGORY_ORDER.filter(c => sets[c]);
  if (!present.length) return null;
  return <View style={styles.legend} accessibilityLabel={present.map(c => `${CATEGORY_LABEL[c]} ${sets[c]} sets`).join(', ')}>
    {present.map(c => <View key={c} style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: categoryColor(c) }]} />
      <Text style={styles.legendText}>{CATEGORY_LABEL[c]} <Text style={styles.legendCount}>{sets[c]}</Text> sets</Text>
    </View>)}
  </View>;
};

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', width: '100%', overflow: 'hidden' },
  emptyStrip: { backgroundColor: theme.colors.border, borderRadius: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 8, height: 8, borderRadius: 1 },
  legendText: { ...theme.type.caption, color: theme.colors.textMuted },
  legendCount: { ...theme.type.numeric, fontVariant: ['tabular-nums'], fontSize: 12, color: theme.colors.textSecondary },
});
