import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Plus, Search, X } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { PressableScale } from '../../components/ui/Primitives';
import { Sheet } from '../../components/layout/Navigation';
import { Exercise } from '../../types';
import { categoryColor, exerciseCategory } from '../../utils/training';

const { colors, type, radius } = theme;

export type ExercisePreset = Omit<Exercise, 'id'>;

const reps = (name: string, targetSets: number, targetReps: number, restSeconds: number, loadMode: Exercise['loadMode'] = 'external'): ExercisePreset =>
  ({ name, type: 'reps', loadMode, targetSets, targetReps, targetWeight: 0, restSeconds });
const timed = (name: string, targetSets: number, targetDurationSeconds: number, restSeconds: number): ExercisePreset =>
  ({ name, type: 'timer', targetSets, targetDurationSeconds, restSeconds });
const dist = (name: string, targetDistance: number, targetDistanceUnit: 'km' | 'm' | 'miles', targetSets = 1, restSeconds = 0): ExercisePreset =>
  ({ name, type: 'distance', targetSets, targetDistance, targetDistanceUnit, restSeconds });

// Common lifts and cardio with sensible starting targets. Picking from one list keeps names
// consistent across routines, so records and progression don't split across spellings.
export const COMMON_EXERCISES: ExercisePreset[] = [
  reps('Back Squat', 5, 5, 150), reps('Front Squat', 4, 6, 120), reps('Deadlift', 3, 5, 180), reps('Romanian Deadlift', 3, 8, 120),
  reps('Bench Press', 4, 6, 120), reps('Incline Bench Press', 3, 8, 90), reps('Overhead Press', 3, 8, 90), reps('Barbell Row', 4, 8, 90),
  reps('Pull-up', 3, 8, 90, 'bodyweight'), reps('Chin-up', 3, 8, 90, 'bodyweight'), reps('Assisted Pull-up', 3, 8, 90, 'assisted'),
  reps('Lat Pulldown', 3, 10, 75), reps('Dip', 3, 10, 90, 'bodyweight'), reps('Push-up', 3, 15, 60, 'bodyweight'),
  reps('Lunge', 3, 10, 75), reps('Leg Press', 3, 10, 120), reps('Hip Thrust', 3, 10, 90), reps('Leg Curl', 3, 12, 60), reps('Calf Raise', 3, 15, 60),
  reps('Bicep Curl', 3, 12, 60), reps('Tricep Extension', 3, 12, 60), reps('Lateral Raise', 3, 15, 60), reps('Face Pull', 3, 15, 60),
  reps('Kettlebell Swing', 4, 20, 60), timed('Plank', 3, 60, 60), timed('Dead Hang', 3, 30, 60),
  dist('Run', 5, 'km'), dist('Walk', 3, 'km'), dist('Cycle', 10, 'km'), dist('Row (erg)', 2000, 'm'),
];

const kindLabel = (p: ExercisePreset) => p.type === 'timer' ? 'Time' : p.type === 'distance' ? 'Distance'
  : p.loadMode === 'bodyweight' ? 'Bodyweight' : p.loadMode === 'assisted' ? 'Assisted' : 'Weighted';

type Props = { visible: boolean; onClose: () => void; routineExercises: Exercise[]; onPick: (preset: ExercisePreset) => void };

export const EditorExercisePicker = ({ visible, onClose, routineExercises, onPick }: Props) => {
  const [query, setQuery] = useState('');
  const { height } = useWindowDimensions();
  useEffect(() => { if (visible) setQuery(''); }, [visible]);

  const { inRoutine, common, exactMatch } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const seen = new Set<string>();
    const own: ExercisePreset[] = [];
    routineExercises.forEach(({ id: _id, notes: _notes, ...rest }) => {
      const key = rest.name.trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      own.push({ ...rest, name: rest.name.trim() });
    });
    const match = (p: ExercisePreset) => !q || p.name.toLowerCase().includes(q);
    const builtIn = COMMON_EXERCISES.filter(p => !seen.has(p.name.toLowerCase()));
    const all = [...own, ...builtIn];
    return { inRoutine: own.filter(match), common: builtIn.filter(match), exactMatch: q ? all.find(p => p.name.toLowerCase() === q) : undefined };
  }, [query, routineExercises]);

  const custom = query.trim().replace(/\s+/g, ' ');
  const row = (p: ExercisePreset) => <PressableScale key={p.name} accessibilityRole="button" accessibilityLabel={`Add ${p.name}, ${kindLabel(p)}`}
    onPress={() => onPick(p)} scaleTo={0.98} style={styles.row}>
    <View style={[styles.mark, { backgroundColor: categoryColor(exerciseCategory(p.name, p.type)) }]} />
    <Text style={styles.rowName} numberOfLines={1}>{p.name}</Text>
    <Text style={styles.rowKind}>{kindLabel(p)}</Text>
  </PressableScale>;

  return <Sheet visible={visible} onClose={onClose}>
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>Add exercise</Text>
      <PressableScale accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} scaleTo={0.92} style={styles.close}><X size={22} color={colors.textMuted} /></PressableScale>
    </View>
    <View style={styles.search}>
      <View style={styles.searchIcon} pointerEvents="none"><Search size={18} color={colors.textMuted} /></View>
      <TextInput
        accessibilityLabel="Search exercises"
        value={query}
        onChangeText={setQuery}
        placeholder="Search or type a new name"
        placeholderTextColor={colors.textSubtle}
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={() => { if (custom) onPick(exactMatch ?? { ...COMMON_CUSTOM, name: custom }); }}
        style={styles.searchInput}
      />
    </View>
    <ScrollView style={{ height: Math.min(440, height * 0.5) }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {!!custom && !exactMatch && <PressableScale accessibilityRole="button" accessibilityLabel={`Add custom exercise ${custom}`} onPress={() => onPick({ ...COMMON_CUSTOM, name: custom })} scaleTo={0.98} style={styles.row}>
        <Plus size={18} color={colors.text} strokeWidth={2.4} />
        <Text style={styles.rowName} numberOfLines={1}>Add “{custom}”</Text>
        <Text style={styles.rowKind}>New</Text>
      </PressableScale>}
      {inRoutine.length > 0 && <Text accessibilityRole="header" style={styles.group}>In this routine</Text>}
      {inRoutine.map(row)}
      {common.length > 0 && <Text accessibilityRole="header" style={styles.group}>Common lifts and cardio</Text>}
      {common.map(row)}
      {!inRoutine.length && !common.length && !custom && <Text style={styles.empty}>No matches.</Text>}
    </ScrollView>
  </Sheet>;
};

// A name typed by the lifter starts as a weighted reps lift, the same default as before.
const COMMON_CUSTOM: ExercisePreset = { name: '', type: 'reps', loadMode: 'external', targetSets: 3, targetReps: 10, restSeconds: 60 };

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { ...type.title, color: colors.text },
  close: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  search: { marginBottom: 6 },
  searchIcon: { position: 'absolute', left: 12, top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 },
  searchInput: { minHeight: 48, ...type.body, color: colors.text, paddingVertical: 0, paddingLeft: 40, paddingRight: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.canvas },
  group: { ...type.caption, color: colors.textMuted, marginTop: 14, marginBottom: 2 },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  mark: { width: 4, height: 18, borderRadius: 2, marginLeft: 7, marginRight: 3 },
  rowName: { flex: 1, minWidth: 0, ...type.heading, color: colors.text },
  rowKind: { ...type.caption, color: colors.textMuted },
  empty: { ...type.body, color: colors.textMuted, marginTop: 16 },
});
