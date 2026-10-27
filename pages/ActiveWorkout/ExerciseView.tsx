import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Exercise } from '../../types';
import { theme } from '../../constants/theme';
import { formatTime } from '../../utils/time';
import { categoryColor, exerciseCategory, formatDecimal } from '../../utils/training';

const n = (v?: number) => formatDecimal(v ?? 0);

// "4 × 6 at 80 kg", "3 × 8", "3 × 1:00", "5 km": the routine's target in the lifter's shorthand.
export const targetLabel = (exercise: Exercise) => {
  const sets = exercise.targetSets || 1;
  if (exercise.type === 'distance') return `${sets > 1 ? `${sets} × ` : ''}${n(exercise.targetDistance)} ${exercise.targetDistanceUnit || 'km'}`;
  if (exercise.type === 'timer') return `${sets} × ${formatTime(exercise.targetDurationSeconds || 0)}`;
  if (exercise.loadMode === 'bodyweight') return `${sets} × ${exercise.targetReps || 0}`;
  if (exercise.loadMode === 'assisted') return `${sets} × ${exercise.targetReps || 0} with ${n(exercise.targetWeight)} kg assist`;
  return `${sets} × ${exercise.targetReps || 0} at ${n(exercise.targetWeight)} kg`;
};

export const ExerciseView = ({ exercise, index, total, setNumber, setCount }: { exercise: Exercise; index: number; total: number; setNumber?: number; setCount?: number }) => {
  const progress = setNumber && setCount ? `Set ${setNumber} of ${setCount}` : setCount ? `${setCount} of ${setCount} sets done` : `Exercise ${index + 1} of ${total}`;
  return <View style={styles.container}>
    <View style={styles.titleRow}>
      <View style={[styles.category, { backgroundColor: categoryColor(exerciseCategory(exercise.name, exercise.type)) }]} />
      <Text accessibilityRole="header" style={styles.title}>{exercise.name}</Text>
    </View>
    <Text style={styles.target}>{progress} · {targetLabel(exercise)}</Text>
    {!!exercise.notes && <Text style={styles.note}>{exercise.notes}</Text>}
  </View>;
};

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  category: { width: 10, height: 10, borderRadius: 2 },
  title: { ...theme.type.title, color: theme.colors.text, flex: 1 },
  target: { ...theme.type.body, color: theme.colors.textMuted, marginTop: 4, fontVariant: ['tabular-nums'] },
  note: { ...theme.type.body, color: theme.colors.textSecondary, marginTop: 10, padding: 12, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface },
});
