import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Exercise } from '../../types';
import { theme } from '../../constants/theme';
import { PressableScale } from '../../components/ui/Primitives';
import { showAlert } from '../../components/ui/Dialog';
import { ProgressionSuggestion } from '../../utils/progression';
import { formatDecimal } from '../../utils/training';
import { formatWeight, getWeightUnit, unitWord, weightStep } from '../../utils/units';

// The step this suggestion takes, as printed, spoken and offered in the dialog.
const stepCopy = (exercise: Exercise) => {
  const mode = exercise.loadMode || 'external', step = formatDecimal(weightStep()), unit = getWeightUnit();
  if (mode === 'bodyweight') return { mark: '+1 rep', spoken: 'add 1 rep', keep: 'Keep +1 rep', revert: 'Use last reps' };
  if (mode === 'assisted') return { mark: `−${step} ${unit}`, spoken: `reduce assistance by ${step} ${unitWord()}`, keep: `Keep −${step} ${unit} assist`, revert: 'Use last assistance' };
  return { mark: `+${step} ${unit}`, spoken: `add ${step} ${unitWord()}`, keep: `Keep +${step} ${unit}`, revert: 'Use last weight' };
};

const todayCopy = (exercise: Exercise, s: ProgressionSuggestion) => {
  const mode = exercise.loadMode || 'external';
  if (mode === 'bodyweight') return `Today: ${s.reps} reps a set.`;
  if (mode === 'assisted') return `Today: ${s.reps} reps with ${formatWeight(s.weight ?? 0)} assist.`;
  return `Today: ${formatWeight(s.weight ?? 0)} × ${s.reps}.`;
};

// Chalk-outlined, never yellow: yellow is a record actually set, this is only an offer.
export const ProgressionChip = ({ exercise, suggestion, onUseLast }: { exercise: Exercise; suggestion: ProgressionSuggestion; onUseLast: () => void }) => {
  const copy = stepCopy(exercise);
  const open = () => {
    void Haptics.selectionAsync();
    showAlert(`Progress: ${copy.mark}`, `${suggestion.reason}. ${todayCopy(exercise, suggestion)}`, [
      { text: copy.revert, onPress: onUseLast },
      { text: copy.keep },
    ]);
  };
  return <PressableScale scaleTo={0.95} accessibilityRole="button" accessibilityLabel={`Progression suggestion: ${copy.spoken}. Tap for details`} onPress={open} style={styles.target}>
    <View style={styles.chip}>
      <Text style={styles.mark}>{copy.mark}</Text>
      <Text style={styles.label}>Progress</Text>
    </View>
  </PressableScale>;
};

const styles = StyleSheet.create({
  target: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  chip: { height: 32, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.text },
  mark: { ...theme.type.label, color: theme.colors.text, fontVariant: ['tabular-nums'] },
  label: { ...theme.type.caption, color: theme.colors.textSecondary },
});
