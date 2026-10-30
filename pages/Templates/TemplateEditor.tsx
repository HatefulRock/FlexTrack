import React, { useRef, useState, ComponentRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Header } from '../../components/layout/Header';
import { Button, PressableScale } from '../../components/ui/Primitives';
import { showAlert } from '../../components/ui/Dialog';
import { theme } from '../../constants/theme';
import { WorkoutTemplate, Exercise } from '../../types';
import { generateId } from '../../utils/helpers';
import { getShortDayName } from '../../utils/formatters';
import { EditorExerciseRow } from './EditorExerciseRow';
import { EditorExercisePicker, ExercisePreset } from './EditorExercisePicker';

const { colors, type, radius } = theme;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MAX_EXERCISES = 200;
// Where the exercise list's first card sits below the section's top edge (the "Exercises" heading row).
const LIST_HEADER_HEIGHT = 44;

const bounded = (value: number | undefined, fallback: number, min: number, max: number) =>
    Math.min(max, Math.max(min, Number.isFinite(value) ? Number(value) : fallback));

// Same bounds as the storage sanitiser, so what is saved is what comes back.
const normalizeExercise = (exercise: Exercise): Exercise => ({
    ...exercise,
    name: exercise.name.trim(),
    targetSets: Math.round(bounded(exercise.targetSets, 1, 1, 100)),
    targetReps: Math.round(bounded(exercise.targetReps, 0, 0, 100_000)),
    targetWeight: bounded(exercise.targetWeight, 0, 0, 100_000),
    targetDurationSeconds: Math.round(bounded(exercise.targetDurationSeconds, 0, 0, 604_800)),
    targetDistance: bounded(exercise.targetDistance, 0, 0, 1_000_000),
    restSeconds: Math.round(bounded(exercise.restSeconds, 0, 0, 86_400)),
});

interface TemplateEditorProps {
    template: WorkoutTemplate | null;
    onSave: (t: WorkoutTemplate) => void;
    onCancel: () => void;
}

export const TemplateEditor = ({ template, onSave, onCancel }: TemplateEditorProps) => {
    const [name, setName] = useState(template?.name || '');
    const [description, setDescription] = useState(template?.description || '');
    const [scheduleDays, setScheduleDays] = useState<number[]>(template?.scheduleDays || []);
    const [exercises, setExercises] = useState<Exercise[]>(template?.exercises || []);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [nameError, setNameError] = useState(false);
    const [missingNames, setMissingNames] = useState<Set<string>>(new Set());

    const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
    const listY = useRef(0);
    const cardY = useRef<Record<string, number>>({});
    const scrollToCard = (id: string) => setTimeout(() => {
        const y = cardY.current[id];
        if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, listY.current + y - 12), animated: true });
    }, 60);

    const toggleDay = (day: number) => {
        Haptics.selectionAsync();
        setScheduleDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b));
    };

    const updateExercise = (id: string, patch: Partial<Exercise>) => {
        setExercises(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
        if (patch.name?.trim()) setMissingNames(prev => { if (!prev.has(id)) return prev; const next = new Set(prev); next.delete(id); return next; });
    };

    const openPicker = () => {
        if (exercises.length >= MAX_EXERCISES) {
            showAlert('Exercise limit reached', `A routine can contain at most ${MAX_EXERCISES} exercises.`);
            return;
        }
        setPickerOpen(true);
    };

    const addExercise = (preset: ExercisePreset) => {
        if (exercises.length >= MAX_EXERCISES) return;
        const id = generateId();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExercises(current => [...current, { ...preset, id }]);
        setExpandedId(id);
        setPickerOpen(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    };

    const moveExercise = (id: string, dir: -1 | 1) => {
        setExercises(current => {
            const i = current.findIndex(e => e.id === id), j = i + dir;
            if (i < 0 || j < 0 || j >= current.length) return current;
            const next = [...current];
            [next[i], next[j]] = [next[j], next[i]];
            return next;
        });
    };

    const removeExercise = (id: string) => {
        setExercises(current => current.filter(e => e.id !== id));
        setExpandedId(prev => prev === id ? null : prev);
    };

    const handleSave = () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setNameError(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }
        const unnamed = exercises.filter(exercise => !exercise.name.trim());
        if (unnamed.length) {
            setMissingNames(new Set(unnamed.map(e => e.id)));
            setExpandedId(unnamed[0].id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            scrollToCard(unnamed[0].id);
            return;
        }
        onSave({
            ...template,
            id: template?.id || generateId(),
            name: trimmedName,
            description: description.trim(),
            exercises: exercises.map(normalizeExercise),
            scheduleDays,
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header
                title={template ? 'Edit routine' : 'New routine'}
                onBack={onCancel}
                rightAction={<Button label="Save" accessibilityLabel="Save routine" onPress={handleSave} style={styles.saveBtn} />}
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
                <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.field}>
                        <Text style={styles.label}>Routine name</Text>
                        <TextInput
                            accessibilityLabel="Routine name"
                            value={name}
                            onChangeText={t => { setName(t); if (nameError && t.trim()) setNameError(false); }}
                            style={[styles.nameInput, nameError && styles.nameInputError]}
                            placeholder="e.g. Push day"
                            placeholderTextColor={colors.textSubtle}
                            returnKeyType="done"
                        />
                        {nameError && <Text accessibilityRole="alert" style={styles.errorText}>Name this routine to save it.</Text>}
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Notes for this routine</Text>
                        <TextInput
                            accessibilityLabel="Notes for this routine"
                            value={description}
                            onChangeText={setDescription}
                            style={styles.notesInput}
                            placeholder="Optional: focus, cues, how to progress"
                            placeholderTextColor={colors.textSubtle}
                            multiline
                            maxLength={500}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text accessibilityRole="header" style={styles.sectionTitle}>Weekly schedule</Text>
                        <View style={styles.daysRow}>
                            {[0, 1, 2, 3, 4, 5, 6].map(d => {
                                const on = scheduleDays.includes(d);
                                return <View key={d} style={styles.dayCell}><PressableScale accessibilityRole="checkbox" accessibilityLabel={DAY_NAMES[d]} accessibilityState={{ checked: on }}
                                    onPress={() => toggleDay(d)} scaleTo={0.94} style={[styles.day, on && styles.dayOn]}>
                                    <Text style={[styles.dayText, on && styles.dayTextOn]}>{getShortDayName(d)}</Text>
                                </PressableScale></View>;
                            })}
                        </View>
                    </View>

                    <View style={styles.section} onLayout={e => { listY.current = e.nativeEvent.layout.y; }}>
                        <View style={styles.sectionRow}>
                            <Text accessibilityRole="header" style={styles.sectionTitle}>Exercises</Text>
                            {exercises.length > 0 && <Text style={styles.count}>{exercises.length}</Text>}
                        </View>
                        <View style={styles.list}>
                            {exercises.map((ex, i) => <EditorExerciseRow
                                key={ex.id}
                                exercise={ex}
                                index={i}
                                count={exercises.length}
                                expanded={expandedId === ex.id}
                                error={missingNames.has(ex.id) && !ex.name.trim() ? 'Name this exercise to save the routine.' : undefined}
                                onToggle={() => setExpandedId(prev => prev === ex.id ? null : ex.id)}
                                onChange={patch => updateExercise(ex.id, patch)}
                                onMove={dir => moveExercise(ex.id, dir)}
                                onRemove={() => removeExercise(ex.id)}
                                onLayout={e => { cardY.current[ex.id] = e.nativeEvent.layout.y + LIST_HEADER_HEIGHT; }}
                            />)}
                            {!exercises.length && <Text style={styles.emptyText}>No exercises yet. Add the first lift or run below.</Text>}
                            <Button label="Add exercise" icon={Plus} variant="secondary" onPress={openPicker} style={styles.addBtn} />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <EditorExercisePicker visible={pickerOpen} onClose={() => setPickerOpen(false)} routineExercises={exercises} onPick={addExercise} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.canvas },
    flex: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },
    saveBtn: { minHeight: 44, paddingHorizontal: 20 },
    field: { marginBottom: 20 },
    label: { ...type.label, color: colors.textMuted, marginBottom: 6 },
    nameInput: {
        ...type.display, color: colors.text, minHeight: 56, paddingVertical: 4, paddingHorizontal: 0,
        borderBottomWidth: 2, borderBottomColor: colors.borderStrong,
    },
    nameInputError: { borderBottomColor: colors.danger },
    errorText: { ...type.caption, fontSize: 13, color: colors.danger, marginTop: 6 },
    notesInput: {
        ...type.body, color: colors.text, minHeight: 72, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12,
        borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm, backgroundColor: colors.canvas, textAlignVertical: 'top',
    },
    section: { marginTop: 12, marginBottom: 8 },
    sectionRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
    sectionTitle: { ...type.title, fontSize: 24, lineHeight: 28, color: colors.text, marginBottom: 10 },
    count: { fontFamily: type.metric.fontFamily, fontVariant: ['tabular-nums'], fontSize: 24, lineHeight: 28, color: colors.textMuted },
    daysRow: { flexDirection: 'row', gap: 6 },
    dayCell: { flex: 1 },
    day: { minHeight: 48, borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    dayOn: { backgroundColor: colors.primary },
    dayText: { ...type.label, color: colors.textSecondary },
    dayTextOn: { color: colors.onPrimary },
    list: { gap: 8 },
    emptyText: { ...type.body, color: colors.textMuted, paddingVertical: 8 },
    addBtn: { marginTop: 4 },
});
