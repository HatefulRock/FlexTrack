import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { Exercise, ExerciseLog, SetLog, WorkoutLog } from '../../types';
import { theme } from '../../constants/theme';
import { formatTime } from '../../utils/time';
import { formatNumber } from '../../utils/training';

type SetValues = Pick<SetLog, 'reps' | 'weight' | 'distance' | 'durationSeconds'>;
const MINUS = '−';
const num = (v: number) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100));
const mode = (e: Exercise) => e.loadMode || 'external';

// Last time's set in shorthand: "85 × 6", "8 reps", "8 reps · 20 kg assist", "1:00", "5 km".
export const paceLabel = (exercise: Exercise, set: SetValues) => {
  if (exercise.type === 'timer') return formatTime(set.durationSeconds || 0);
  if (exercise.type === 'distance') return `${num(set.distance || 0)} ${exercise.targetDistanceUnit || 'km'}`;
  if (mode(exercise) === 'bodyweight') return `${set.reps || 0} reps`;
  if (mode(exercise) === 'assisted') return `${set.reps || 0} reps · ${num(set.weight || 0)} kg assist`;
  return `${num(set.weight || 0)} × ${set.reps || 0}`;
};

export interface PacePart { text: string; spoken: string; better: boolean; }

// How this set compares with the same set last time, one part per changed quantity. Less assistance is better.
export const paceDelta = (exercise: Exercise, current: SetValues, last?: SetValues): PacePart[] => {
  if (!last) return [];
  const parts: PacePart[] = [];
  const sign = (d: number) => (d > 0 ? '+' : MINUS);
  const diff = (a?: number, b?: number) => Math.round(((a || 0) - (b || 0)) * 100) / 100;
  if (exercise.type === 'timer') {
    const d = diff(current.durationSeconds, last.durationSeconds);
    if (d) parts.push({ text: `${sign(d)}${Math.abs(d) < 60 ? `${Math.abs(d)} s` : formatTime(Math.abs(d))}`, spoken: `${d > 0 ? 'up' : 'down'} ${Math.abs(d)} seconds`, better: d > 0 });
    return parts;
  }
  if (exercise.type === 'distance') {
    const unit = exercise.targetDistanceUnit || 'km', d = diff(current.distance, last.distance);
    if (d) parts.push({ text: `${sign(d)}${num(Math.abs(d))} ${unit}`, spoken: `${d > 0 ? 'up' : 'down'} ${num(Math.abs(d))} ${unit}`, better: d > 0 });
    return parts;
  }
  if (mode(exercise) !== 'bodyweight') {
    const d = diff(current.weight, last.weight), assisted = mode(exercise) === 'assisted';
    if (d) parts.push({ text: `${sign(d)}${num(Math.abs(d))} kg${assisted ? ' assist' : ''}`, spoken: `${d > 0 ? 'up' : 'down'} ${num(Math.abs(d))} kilograms${assisted ? ' of assistance' : ''}`, better: assisted ? d < 0 : d > 0 });
  }
  const r = diff(current.reps, last.reps);
  if (r) parts.push({ text: `${sign(r)}${Math.abs(r)} ${Math.abs(r) === 1 ? 'rep' : 'reps'}`, spoken: `${r > 0 ? 'up' : 'down'} ${Math.abs(r)} ${Math.abs(r) === 1 ? 'rep' : 'reps'}`, better: r > 0 });
  return parts;
};

// The delta mark: improvement printed in chalk with a sign, a shortfall in muted text. Never green, never red.
export const PaceMark = ({ parts, style }: { parts: PacePart[]; style?: TextStyle }) => {
  if (!parts.length) return null;
  return <Text style={[styles.mark, style]} numberOfLines={1} accessible={false} importantForAccessibility="no">
    {parts.map((p, i) => <Text key={p.text} style={p.better ? styles.better : styles.worse}>{i ? ' ' : ''}{p.text}</Text>)}
  </Text>;
};

const findExercise = (log: WorkoutLog, e: ExerciseLog) => log.exercises.find(x => x.exerciseId === e.exerciseId) || log.exercises.find(x => x.exerciseName.toLowerCase() === e.exerciseName.toLowerCase());
const isExternal = (e: ExerciseLog) => (e.exerciseType ?? 'reps') === 'reps' && (e.loadMode || 'external') === 'external';

// Running kg difference against the last session of this routine: completed sets only, set for set, same exercises only.
export const routinePace = (logs: ExerciseLog[], previous: WorkoutLog) => {
  let delta = 0, compared = 0;
  logs.forEach(e => {
    if (!isExternal(e)) return;
    const prev = findExercise(previous, e);
    if (!prev) return;
    e.sets.forEach((s, i) => {
      const p = prev.sets[i];
      if (!s.completed || !p) return;
      compared += 1;
      delta += (s.weight || 0) * (s.reps || 0) - (p.completed ? (p.weight || 0) * (p.reps || 0) : 0);
    });
  });
  return { delta: Math.round(delta * 10) / 10, compared };
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "earlier today", "yesterday", "last Tuesday", "12 Oct".
export const sessionDayLabel = (at: number, now = Date.now()) => {
  const day = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const days = Math.round((day(now) - day(at)) / 86_400_000);
  const d = new Date(at);
  if (days <= 0) return 'earlier today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `last ${DAY_NAMES[d.getDay()]}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

// Quiet header line: "+240 kg vs last Tuesday", "Even with last Tuesday".
export const RoutinePace = ({ logs, previous, style }: { logs: ExerciseLog[]; previous: WorkoutLog; style?: TextStyle }) => {
  const { delta } = routinePace(logs, previous);
  const when = sessionDayLabel(previous.endTime || previous.startTime);
  const abs = Math.abs(delta), amount = abs >= 1000 ? formatNumber(abs) : num(abs);
  const text = delta === 0 ? `Even with ${when}` : `${delta > 0 ? '+' : MINUS}${amount} kg vs ${when}`;
  const spoken = delta === 0 ? `Even with ${when}` : `${amount} kilograms ${delta > 0 ? 'ahead of' : 'behind'} ${when}`;
  return <Text numberOfLines={1} accessibilityLabel={spoken} style={[styles.routine, style, delta > 0 ? styles.better : styles.worse]}>{text}</Text>;
};

const styles = StyleSheet.create({
  mark: { ...theme.type.label, fontVariant: ['tabular-nums'] },
  better: { color: theme.colors.text },
  worse: { color: theme.colors.textMuted },
  routine: { ...theme.type.caption, fontVariant: ['tabular-nums'] },
});
