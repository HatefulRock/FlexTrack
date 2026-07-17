import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView
} from 'react-native';
import { Save, Plus, Trash2 } from 'lucide-react-native'; // Removed X if unused
import { Header } from '../../components/layout/Header';
import { WorkoutTemplate, Exercise } from '../../types';
import { generateId } from '../../utils/helpers';
import { getShortDayName } from '../../utils/formatters';

interface TemplateEditorProps {
    template: WorkoutTemplate | null;
    onSave: (t: WorkoutTemplate) => void;
    onCancel: () => void;
}

export const TemplateEditor = ({
    template,
    onSave,
    onCancel
}: TemplateEditorProps) => {
    // Initial State
    const [name, setName] = useState(template?.name || '');
    const [scheduleDays, setScheduleDays] = useState<number[]>(template?.scheduleDays || []);
    const [exercises, setExercises] = useState<Exercise[]>(template?.exercises || []);

    const toggleDay = (day: number) => {
        setScheduleDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
    };

    const updateExercise = (id: string, field: keyof Exercise, value: any) => {
        setExercises(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
    };

    const addExercise = () => {
        setExercises([...exercises, { id: generateId(), name: '', type: 'reps', loadMode: 'external', targetSets: 3, targetReps: 10, restSeconds: 60 }]);
    };

    const removeExercise = (id: string) => {
        setExercises(exercises.filter(e => e.id !== id));
    };

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({
            id: template?.id || generateId(),
            name,
            description: template?.description || '',
            exercises,
            scheduleDays
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header
                title={template ? 'Edit Routine' : 'Create Routine'}
                onBack={onCancel}
                rightAction={
                    <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                        <Save size={20} color="#38BDF8" />
                        <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                }
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* SECTION 1: NAME & SCHEDULE */}
                    <View style={styles.topSection}>
                        <Text style={styles.label}>Routine Name</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            style={styles.mainNameInput}
                            placeholder="e.g. Push Day"
                            placeholderTextColor="#475569"
                        />

                        <Text style={[styles.label, { marginTop: 24 }]}>Weekly Schedule</Text>
                        <View style={styles.daysRow}>
                            {[0, 1, 2, 3, 4, 5, 6].map(d => (
                                <TouchableOpacity
                                    key={d}
                                    onPress={() => toggleDay(d)}
                                    style={[
                                        styles.dayCircle,
                                        scheduleDays.includes(d) ? styles.dayActive : styles.dayInactive
                                    ]}
                                >
                                    <Text style={[
                                        styles.dayText,
                                        scheduleDays.includes(d) ? styles.dayTextActive : styles.dayTextInactive
                                    ]}>
                                        {getShortDayName(d)[0]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* SECTION 2: EXERCISES */}
                    <Text style={styles.sectionTitle}>Exercises ({exercises.length})</Text>

                    <View style={{ gap: 16 }}>
                        {exercises.map((ex, i) => (
                            <View key={ex.id} style={styles.card}>

                                {/* Card Header */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.indexBadge}>
                                        <Text style={styles.indexText}>{i + 1}</Text>
                                    </View>
                                    <TextInput
                                        value={ex.name}
                                        onChangeText={txt => updateExercise(ex.id, 'name', txt)}
                                        style={styles.exNameInput}
                                        placeholder="Exercise Name"
                                        placeholderTextColor="#64748b"
                                    />
                                    <TouchableOpacity onPress={() => removeExercise(ex.id)} style={styles.trashBtn}>
                                        <Trash2 size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>

                                {/* Row 1: Type Selector */}
                                <View style={styles.controlRow}>
                                    <View style={styles.segmentContainer}>
                                        {['reps', 'timer', 'distance'].map((t) => (
                                            <TouchableOpacity
                                                key={t}
                                                onPress={() => updateExercise(ex.id, 'type', t)}
                                                style={[
                                                    styles.segmentBtn,
                                                    ex.type === t && styles.segmentBtnActive
                                                ]}
                                            >
                                                <Text style={[
                                                    styles.segmentText,
                                                    ex.type === t ? styles.segmentTextActive : styles.segmentTextInactive
                                                ]}>
                                                    {t === 'reps' ? 'Reps' : t === 'timer' ? 'Time' : 'Dist'}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {ex.type === 'reps' && <View style={[styles.segmentContainer, styles.loadModes]}>
                                        {(['external', 'bodyweight', 'assisted'] as const).map(mode => <TouchableOpacity key={mode} onPress={() => updateExercise(ex.id, 'loadMode', mode)} style={[styles.segmentBtn, (ex.loadMode || 'external') === mode && styles.segmentBtnActive]}>
                                            <Text style={[styles.segmentText, (ex.loadMode || 'external') === mode ? styles.segmentTextActive : styles.segmentTextInactive]}>{mode === 'external' ? 'Weighted' : mode === 'bodyweight' ? 'Bodyweight' : 'Assisted'}</Text>
                                        </TouchableOpacity>)}
                                    </View>}
                                </View>

                                {/* Row 2: Inputs Grid */}
                                <View style={styles.inputsGrid}>
                                    {/* SETS */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>SETS</Text>
                                        <TextInput
                                            value={ex.targetSets?.toString() || ''}
                                            onChangeText={txt => updateExercise(ex.id, 'targetSets', parseInt(txt) || 0)}
                                            keyboardType="numeric"
                                            style={styles.bigInput}
                                        />
                                    </View>

                                    {/* CONDITIONAL INPUTS */}
                                    {ex.type === 'reps' && (
                                        <View style={{ flexDirection: 'row', gap: 12, flex: 2 }}>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>REPS</Text>
                                                <TextInput
                                                    value={ex.targetReps?.toString() || ''}
                                                    onChangeText={txt => updateExercise(ex.id, 'targetReps', parseInt(txt) || 0)}
                                                    keyboardType="numeric"
                                                    style={styles.bigInput}
                                                />
                                            </View>
                                            {(ex.loadMode || 'external') !== 'bodyweight' && <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>{ex.loadMode === 'assisted' ? 'ASSISTANCE (KG)' : 'WEIGHT (KG)'}</Text>
                                                <TextInput
                                                    value={ex.targetWeight?.toString() || '0'}
                                                    onChangeText={txt => updateExercise(ex.id, 'targetWeight', parseFloat(txt) || 0)}
                                                    keyboardType="numeric"
                                                    style={styles.bigInput}
                                                />
                                            </View>}
                                        </View>
                                    )}

                                    {ex.type === 'timer' && (
                                        <View style={{ flex: 2 }}>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>SECONDS</Text>
                                                <TextInput
                                                    value={ex.targetDurationSeconds?.toString() || ''}
                                                    onChangeText={txt => updateExercise(ex.id, 'targetDurationSeconds', parseInt(txt) || 0)}
                                                    keyboardType="numeric"
                                                    style={styles.bigInput}
                                                />
                                            </View>
                                        </View>
                                    )}

                                    {ex.type === 'distance' && (
                                        <View style={{ flexDirection: 'row', gap: 12, flex: 2 }}>
                                            <View style={[styles.inputGroup, { flex: 1.5 }]}>
                                                <Text style={styles.inputLabel}>DIST</Text>
                                                <TextInput
                                                    value={ex.targetDistance?.toString() || ''}
                                                    onChangeText={txt => updateExercise(ex.id, 'targetDistance', parseFloat(txt) || 0)}
                                                    keyboardType="numeric"
                                                    style={styles.bigInput}
                                                />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>UNIT</Text>
                                                <TouchableOpacity
                                                    style={styles.unitToggle}
                                                    onPress={() => {
                                                        const units = ['km', 'm', 'miles'];
                                                        const idx = units.indexOf(ex.targetDistanceUnit || 'km');
                                                        updateExercise(ex.id, 'targetDistanceUnit', units[(idx + 1) % 3]);
                                                    }}
                                                >
                                                    <Text style={styles.unitText}>{ex.targetDistanceUnit || 'km'}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}

                                    {/* Rest Timer */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>REST (s)</Text>
                                        <TextInput
                                            value={ex.restSeconds?.toString() || '0'}
                                            onChangeText={txt => updateExercise(ex.id, 'restSeconds', parseInt(txt) || 0)}
                                            keyboardType="numeric"
                                            style={[styles.bigInput, styles.restInput]}
                                        />
                                    </View>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity onPress={addExercise} style={styles.addBtn}>
                            <Plus size={20} color="#94a3b8" />
                            <Text style={styles.addBtnText}>Add Exercise</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#080B10',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    saveBtnText: {
        color: '#38BDF8',
        fontWeight: 'bold',
        fontSize: 14,
    },
    topSection: {
        marginBottom: 32,
    },
    label: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    mainNameInput: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#F7F9FC',
        borderBottomWidth: 2,
        borderBottomColor: '#263245',
        paddingVertical: 8,
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111722',
    },
    dayActive: {
        backgroundColor: '#38BDF8',
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 4,
    },
    dayInactive: {
        borderWidth: 1,
        borderColor: '#263245',
    },
    dayText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    dayTextActive: { color: '#F7F9FC' },
    dayTextInactive: { color: '#64748b' },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#F7F9FC',
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#111722',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#263245',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    indexBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#182130',
        alignItems: 'center',
        justifyContent: 'center',
    },
    indexText: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: 'bold',
    },
    exNameInput: {
        flex: 1,
        minWidth: 0,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#F7F9FC',
    },
    trashBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
    },
    controlRow: {
        marginBottom: 16,
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: '#182130',
        borderRadius: 12,
        padding: 4,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    segmentBtnActive: {
        backgroundColor: '#263245',
    },
    segmentText: {
        fontSize: 12,
        fontWeight: '600',
    },
    segmentTextActive: { color: '#F7F9FC' },
    segmentTextInactive: { color: '#64748b' },
    loadModes: {
        marginTop: 8,
    },
    inputsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    inputGroup: {
        flex: 1,
        alignItems: 'center',
    },
    inputLabel: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: 'bold',
        marginBottom: 6,
    },
    bigInput: {
        width: '100%',
        height: 48,
        backgroundColor: '#182130',
        borderRadius: 12,
        textAlign: 'center',
        color: '#F7F9FC',
        fontSize: 18,
        fontWeight: 'bold',
        borderWidth: 1,
        borderColor: '#263245',
    },
    restInput: {
        borderColor: '#263245',
        color: '#94a3b8'
    },
    unitToggle: {
        width: '100%',
        height: 48,
        backgroundColor: '#182130',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#263245',
    },
    unitText: {
        color: '#38BDF8',
        fontWeight: 'bold',
    },
    addBtn: {
        marginTop: 8,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#263245',
        borderStyle: 'dashed',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    addBtnText: {
        color: '#94a3b8',
        fontWeight: 'bold',
        fontSize: 16,
    },
});




