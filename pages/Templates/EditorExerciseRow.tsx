import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';
import { PressableScale } from '../../components/ui/Primitives';
import { Exercise, ExerciseType, LoadMode } from '../../types';
import { CATEGORY_LABEL, categoryColor, exerciseCategory } from '../../utils/training';
import { EditorSegmented, EditorStepper, exerciseSummary } from './EditorControls';

const { colors, type, radius } = theme;

type Props = {
  exercise: Exercise;
  index: number;
  count: number;
  expanded: boolean;
  error?: string;
  onToggle: () => void;
  onChange: (patch: Partial<Exercise>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
};

const TYPES: { value: ExerciseType; label: string; a11y: string }[] = [
  { value: 'reps', label: 'Reps', a11y: 'Reps' }, { value: 'timer', label: 'Time', a11y: 'Time' }, { value: 'distance', label: 'Dist.', a11y: 'Distance' },
];
const MODES: { value: LoadMode; label: string }[] = [
  { value: 'external', label: 'Weighted' }, { value: 'bodyweight', label: 'Bodyweight' }, { value: 'assisted', label: 'Assisted' },
];
const UNITS: { value: 'km' | 'm' | 'miles'; label: string; a11y: string }[] = [
  { value: 'km', label: 'km', a11y: 'Kilometres' }, { value: 'm', label: 'm', a11y: 'Metres' }, { value: 'miles', label: 'mi', a11y: 'Miles' },
];

export const EditorExerciseRow = ({ exercise: ex, index, count, expanded, error, onToggle, onChange, onMove, onRemove, onLayout }: Props) => {
  const [nameFocused, setNameFocused] = useState(false);
  const label = ex.name.trim() || `exercise ${index + 1}`;
  const category = exerciseCategory(ex.name, ex.type);
  const mode = ex.loadMode || 'external';
  const unit = ex.targetDistanceUnit || 'km';
  const summary = exerciseSummary(ex);

  const setType = (t: ExerciseType) => onChange({
    type: t,
    ...(t === 'timer' && !ex.targetDurationSeconds ? { targetDurationSeconds: 60 } : null),
    ...(t === 'distance' && !ex.targetDistance ? { targetDistance: 5, targetDistanceUnit: unit } : null),
  });

  return <View onLayout={onLayout} style={[styles.card, expanded && styles.cardOpen]}>
    <View style={styles.head}>
      <View style={styles.index} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.mark, { backgroundColor: categoryColor(category) }]} />
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>
      <TextInput
        accessibilityLabel="Exercise name"
        value={ex.name}
        onChangeText={name => onChange({ name })}
        onFocus={() => setNameFocused(true)}
        onBlur={() => setNameFocused(false)}
        placeholder="Exercise name"
        placeholderTextColor={colors.textSubtle}
        returnKeyType="done"
        style={[styles.name, (expanded || nameFocused || !!error) && styles.nameEditing, !!error && styles.nameError]}
      />
      <PressableScale accessibilityRole="button" accessibilityLabel={expanded ? `Collapse ${label}` : `Edit ${label} targets`} accessibilityState={{ expanded }}
        onPress={onToggle} scaleTo={0.92} style={styles.chevron}>
        {expanded ? <ChevronUp size={22} color={colors.textMuted} /> : <ChevronDown size={22} color={colors.textMuted} />}
      </PressableScale>
    </View>
    {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}

    <PressableScale accessibilityRole="button" accessibilityLabel={`${label}, ${CATEGORY_LABEL[category]}: ${summary}. ${expanded ? 'Collapse' : 'Expand to edit'}`} accessibilityState={{ expanded }}
      onPress={onToggle} scaleTo={0.99} style={styles.summaryHit}>
      <Text style={styles.summary} numberOfLines={1}>{summary}</Text>
    </PressableScale>

    {expanded && <View style={styles.body}>
      <View style={styles.controlRow}>
        <EditorSegmented options={TYPES} value={ex.type} onChange={setType} style={styles.typeSeg} />
        {ex.type === 'reps' && <EditorSegmented options={MODES} value={mode} onChange={m => onChange({ loadMode: m })} style={styles.modeSeg} />}
      </View>
      {ex.type === 'reps' && mode === 'assisted' && <Text style={styles.hint}>Machine or band help: the less assistance, the harder the set</Text>}

      <View style={styles.grid}>
        <EditorStepper label="Sets" a11y={`Sets for ${label}`} value={ex.targetSets} onChange={v => onChange({ targetSets: v })} step={1} min={1} max={100} integer />
        {ex.type === 'reps' && <EditorStepper label="Reps" a11y={`Reps for ${label}`} value={ex.targetReps} onChange={v => onChange({ targetReps: v })} step={1} max={100_000} integer />}
        {ex.type === 'reps' && mode !== 'bodyweight' && <EditorStepper label={mode === 'assisted' ? 'Assistance kg' : 'kg'} a11y={`${mode === 'assisted' ? 'Assistance kilograms' : 'Kilograms'} for ${label}`}
          value={ex.targetWeight} onChange={v => onChange({ targetWeight: v })} step={2.5} max={100_000} />}
        {ex.type === 'timer' && <EditorStepper label="Time (m:ss)" a11y={`Time per set for ${label}`} value={ex.targetDurationSeconds} onChange={v => onChange({ targetDurationSeconds: v })} step={15} max={604_800} clock />}
        {ex.type === 'distance' && <EditorStepper label={`Distance (${unit})`} a11y={`Distance for ${label}`} value={ex.targetDistance} onChange={v => onChange({ targetDistance: v })}
          step={unit === 'm' ? 100 : 0.5} max={1_000_000} />}
        {ex.type === 'distance' && <View style={styles.unitCell}>
          <Text style={styles.cellLabel}>Unit</Text>
          <EditorSegmented options={UNITS} value={unit} onChange={u => onChange({ targetDistanceUnit: u })} />
        </View>}
        <EditorStepper label="Rest (m:ss)" a11y={`Rest for ${label}`} value={ex.restSeconds} onChange={v => onChange({ restSeconds: v })} step={15} max={86_400} clock />
      </View>

      <View style={styles.footer}>
        <PressableScale accessibilityRole="button" accessibilityLabel={`Move ${label} up`} accessibilityState={{ disabled: index === 0 }} disabled={index === 0}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onMove(-1); }} scaleTo={0.92} style={[styles.moveBtn, index === 0 && styles.off]}>
          <ArrowUp size={20} color={colors.text} />
        </PressableScale>
        <PressableScale accessibilityRole="button" accessibilityLabel={`Move ${label} down`} accessibilityState={{ disabled: index === count - 1 }} disabled={index === count - 1}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onMove(1); }} scaleTo={0.92} style={[styles.moveBtn, index === count - 1 && styles.off]}>
          <ArrowDown size={20} color={colors.text} />
        </PressableScale>
        <View style={styles.flex} />
        <PressableScale accessibilityRole="button" accessibilityLabel={`Remove ${label} from routine`} onPress={onRemove} scaleTo={0.97} style={styles.removeBtn}>
          <Text style={styles.removeText}>Remove exercise</Text>
        </PressableScale>
      </View>
    </View>}
  </View>;
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingTop: 10, paddingHorizontal: 12 },
  cardOpen: { paddingBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  index: { width: 30, flexDirection: 'row', alignItems: 'center', gap: 6 },
  // A calibrated plate seen edge-on: the training-split colour of the lift.
  mark: { width: 4, height: 18, borderRadius: 2 },
  indexText: { fontFamily: type.metric.fontFamily, fontVariant: ['tabular-nums'], fontSize: 22, lineHeight: 24, color: colors.textMuted },
  name: { flex: 1, minWidth: 0, minHeight: 44, ...type.heading, color: colors.text, paddingVertical: 0, paddingHorizontal: 0, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  nameEditing: { borderBottomColor: colors.borderStrong },
  nameError: { borderBottomColor: colors.danger },
  errorText: { ...type.caption, color: colors.danger, marginLeft: 38, marginTop: 4 },
  chevron: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  summaryHit: { minHeight: 44, paddingLeft: 38, paddingTop: 2, justifyContent: 'flex-start' },
  summary: { ...type.body, fontFamily: type.numeric.fontFamily, fontSize: 14, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  body: { gap: 12 },
  controlRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeSeg: { flexGrow: 0, flexShrink: 0 },
  modeSeg: { flexGrow: 1, flexShrink: 1, flexBasis: 220 },
  hint: { ...type.caption, color: colors.textMuted, marginTop: -4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 12 },
  unitCell: { flexGrow: 1, flexBasis: 150, gap: 6 },
  cellLabel: { ...type.caption, color: colors.textMuted },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  moveBtn: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  off: { opacity: 0.35 },
  flex: { flex: 1 },
  removeBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, marginRight: -8 },
  removeText: { ...type.label, color: colors.danger },
});
