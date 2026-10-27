import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Exercise } from '../../types';
import { theme } from '../../constants/theme';
import { PressableScale } from '../../components/ui/Primitives';
import { showAlert } from '../../components/ui/Dialog';
import { PROGRESSION_STEP_KG, ProgressionSuggestion } from '../../utils/progression';
import { formatDecimal as kg } from '../../utils/training';

// The step this suggestion takes, as printed, spoken and offered in the dialog.
const stepCopy = (exercise: Exercise) => {
  const mode = exercise.loadMode || 'external', step = kg(PROGRESSION_STEP_KG);
  if (mode === 'bodyweight') return { mark: '+1 rep', spoken: 'add 1 rep', keep: 'Keep +1 rep', revert: 'Use last reps' };
  if (mode === 'assisted') return { mark: `−${step} kg`, spoken: `reduce assistance by ${step} kilograms`, keep: `Keep −${step} kg assist`, revert: 'Use last assistance' };
  return { mark: `+${step} kg`, spoken: `add ${step} kilograms`, keep: `Keep +${step} kg`, revert: 'Use last weight' };
};

const todayCopy = (exercise: Exercise, s: ProgressionSuggestion) => {
  const mode = exercise.loadMode || 'external';
  if (mode === 'bodyweight') return `Today: ${s.reps} reps a set.`;
  if (mode === 'assisted') return `Today: ${s.reps} reps with ${kg(s.weight ?? 0)} kg assist.`;
  return `Today: ${kg(s.weight ?? 0)} kg × ${s.reps}.`;
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
