import React, { useEffect, useMemo, useRef, useState, ComponentRef } from 'react';
import { Animated, BackHandler, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, Zap } from 'lucide-react-native';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Exercise, ExerciseLog, SetLog, WorkoutLog, WorkoutTemplate } from '../../types';
import { generateId } from '../../utils/helpers';
import { BAR_KG } from '../../utils/training';
import { ActiveSession, saveActiveSession } from '../../utils/activeSession';
import { useWorkoutTimer } from '../../hooks/useWorkoutTimer';
import { RestDock, RestNext, RestOverlay } from './RestControl';
import { ExerciseView, targetLabel } from './ExerciseView';
import { describeSet, SetList } from './SetList';
import { RoutinePace } from './PaceParts';
import { ProgressionSuggestion, suggestProgression } from '../../utils/progression';
import { Button, EmptyState, PressableScale, useReducedMotion } from '../../components/ui/Primitives';
import { showAlert } from '../../components/ui/Dialog';
import { theme } from '../../constants/theme';

interface Props {
  template: WorkoutTemplate; resume?: ActiveSession | null; previousLogs: WorkoutLog[];
  onUpdateTemplate: (template: WorkoutTemplate) => void; onFinish: (log: WorkoutLog | null) => void;
}

const MAX_SETS = 100;
const DEFAULT_REST_SECONDS = 60;
const REST_STEP_SECONDS = 15;
// Judge lights replay only while the completion is this fresh, so returning to an exercise later does not relight them.
const LIGHTS_WINDOW_MS = 2500;

const byRecent = (logs: WorkoutLog[]) => [...logs].sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime));

// The most recent performance of this exercise: matched by id, then by name.
const lastLogFor = (exercise: Exercise, recent: WorkoutLog[]): ExerciseLog | undefined => {
  for (const log of recent) {
    const hit = log.exercises.find(e => e.exerciseId === exercise.id) || log.exercises.find(e => e.exerciseName.toLowerCase() === exercise.name.toLowerCase());
    if (hit?.sets.length) return hit;
  }
  return undefined;
};
const lastSetsFor = (exercise: Exercise, recent: WorkoutLog[]): SetLog[] | undefined => lastLogFor(exercise, recent)?.sets;

// Set i as last time left it (the routine target fills any gap), or at the progression step when one was earned.
const prefill = (e: Exercise, i: number, last?: SetLog[], suggestion?: ProgressionSuggestion | null): Pick<SetLog, 'reps' | 'weight'> => {
  const mode = e.type === 'reps' ? (e.loadMode || 'external') : undefined;
  if (suggestion) return { reps: suggestion.reps, weight: mode === 'bodyweight' ? undefined : suggestion.weight };
  const h = e.type === 'reps' ? last?.[i] : undefined;
  const reps = h && (h.reps ?? 0) > 0 ? h.reps : e.targetReps;
  const weight = mode === 'bodyweight' ? undefined : h && typeof h.weight === 'number' && h.weight > 0 ? h.weight : e.targetWeight;
  return { reps, weight };
};

// Sets start from what the lifter did last time, set for set, or from the earned progression.
const buildLogs = (template: WorkoutTemplate, recent: WorkoutLog[], suggestions: (ProgressionSuggestion | null)[]): ExerciseLog[] => template.exercises.map((e, j) => {
  const mode = e.type === 'reps' ? (e.loadMode || 'external') : undefined;
  const last = lastSetsFor(e, recent);
  const setCount = Math.min(MAX_SETS, Math.max(1, Math.floor(e.targetSets ?? 1)));
  return {
    exerciseId: e.id, exerciseName: e.name, exerciseType: e.type, loadMode: mode, distanceUnit: e.targetDistanceUnit, completed: false,
    sets: Array.from({ length: setCount }, (_, i) => ({
      setNumber: i + 1, completed: false, ...prefill(e, i, last, suggestions[j]),
      distance: e.targetDistance, durationSeconds: e.targetDurationSeconds, notes: '',
    })),
  };
});

// A timer set keeps the time actually run, when its timer was started.
const withTimedDuration = (exercise: ExerciseLog, set: SetLog, elapsed = 0): SetLog =>
  exercise.exerciseType === 'timer' && elapsed > 0 ? { ...set, durationSeconds: elapsed } : set;

// The first open set of a later exercise than `from`: what follows once this exercise is done.
const firstOpenAfter = (template: WorkoutTemplate, logs: ExerciseLog[], from: number): { exercise: Exercise; set: SetLog } | null => {
  for (let j = from + 1; j < logs.length; j++) {
    const k = logs[j].sets.findIndex(s => !s.completed);
    if (k >= 0) return { exercise: template.exercises[j], set: logs[j].sets[k] };
  }
  return null;
};

const clock = (seconds: number) => {
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  const ss = s.toString().padStart(2, '0');
  return h ? `${h}:${m.toString().padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};

const SEGMENTED_PROGRESS_MAX = 40;

// One segment per set; past SEGMENTED_PROGRESS_MAX sets the segments would be slivers, so it becomes a single fill.
const SessionProgress = ({ logs, activeExerciseIndex, done, all }: { logs: ExerciseLog[]; activeExerciseIndex: number; done: number; all: number }) => (
  <View style={styles.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: all, now: done }}>
    {all <= SEGMENTED_PROGRESS_MAX
      ? logs.flatMap((e, ei) => e.sets.map((s, si) => (
        <View key={`${ei}-${si}`} style={[styles.segment, s.completed && styles.segmentDone, ei === activeExerciseIndex && !s.completed && styles.segmentCurrent]} />
      )))
      : <View style={[styles.segment, styles.segmentDone, { flex: 0, width: `${(done / Math.max(1, all)) * 100}%` }]} />}
  </View>
);

// Isolated so the whole page does not re-render every second.
const ElapsedClock = ({ startTime }: { startTime: number }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const seconds = Math.max(0, Math.floor((now - startTime) / 1000));
  return <Text accessibilityRole="timer" accessibilityLabel={`Session time ${clock(seconds)}`} style={styles.clock}>{clock(seconds)}</Text>;
};

export const ActiveWorkoutPage = ({ template, resume, previousLogs, onUpdateTemplate, onFinish }: Props) => {
  useKeepAwake();
  const reduced = useReducedMotion();
  const recent = useMemo(() => byRecent(previousLogs), [previousLogs]);
  const [startTime] = useState(() => resume?.startTime ?? Date.now());
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(() => resume?.activeExerciseIndex ?? 0);
  // Earned progressions, from the last performance of each exercise. A resumed session keeps its saved logs and is never re-prefilled.
  const suggestions = useMemo(() => template.exercises.map(e => suggestProgression(e, lastLogFor(e, recent))), [template.exercises, recent]);
  const [logs, setLogs] = useState<ExerciseLog[]>(() => resume?.logs ?? buildLogs(template, recent, suggestions));
  // The last session of this routine, for the running comparison in the header.
  const lastRoutineLog = useMemo(() => recent.find(l => l.templateId === template.id && l.exercises.length > 0), [recent, template.id]);
  const [restExpanded, setRestExpanded] = useState(false);
  const [focusSet, setFocusSet] = useState<number | null>(null);
  // Judge lights play for the set just completed (set -1: the whole exercise), on that exercise only, and only once.
  const [lights, setLights] = useState({ n: 0, exercise: -1, set: -1, at: 0 });
  const { timers, timerRunning, restEndsAt, restTotal, isResting, toggleTimer, startRest, cancelRest, adjustRest } = useWorkoutTimer();
  const currentExercise = template.exercises[activeExerciseIndex], currentLog = logs[activeExerciseIndex];
  const isLast = activeExerciseIndex === template.exercises.length - 1;

  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const enter = useRef(new Animated.Value(1)).current;
  const direction = useRef(1);
  const shownExercise = useRef(activeExerciseIndex);

  // Never strand the footer behind an expanded rest that has ended or been skipped.
  useEffect(() => { if (!isResting) setRestExpanded(false); }, [isResting]);

  // Write-through so a reload or app kill never loses the session.
  useEffect(() => {
    const id = setTimeout(() => { void saveActiveSession({ template, startTime, activeExerciseIndex, logs }); }, 300);
    return () => clearTimeout(id);
  }, [template, startTime, activeExerciseIndex, logs]);

  // New exercise: back to the top, content slides in from the side it came from.
  useEffect(() => {
    if (shownExercise.current === activeExerciseIndex) return;
    shownExercise.current = activeExerciseIndex;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    enter.setValue(0);
    const anim = Animated.timing(enter, { toValue: 1, duration: reduced ? 160 : 220, easing: theme.motion.easeOut, useNativeDriver: theme.motion.nativeDriver });
    anim.start();
    return () => { anim.stop(); enter.setValue(1); };
  }, [activeExerciseIndex, enter, reduced]);

  const historySets = useMemo(() => (currentExercise ? lastSetsFor(currentExercise, recent) : undefined), [currentExercise, recent]);

  const finishWorkout = () => {
    cancelRest();
    onFinish({
      id: generateId(), templateId: template.id, templateName: template.name, source: 'routine', startTime, endTime: Date.now(),
      exercises: logs.map((e, eIndex) => ({
        ...e,
        sets: e.sets.map((set, setIndex) => withTimedDuration(e, set, timers[`${eIndex}-${setIndex}`])),
        completed: e.sets.length > 0 && e.sets.every(s => s.completed),
      })),
    });
  };
  const confirmExit = () => showAlert('End this session?', 'Save the sets you have logged, or discard this session.', [
    { text: 'Keep training', style: 'cancel' },
    { text: 'Discard', style: 'destructive', onPress: () => onFinish(null) },
    { text: 'Save & end', onPress: finishWorkout },
  ]);
  const confirmExitRef = useRef(confirmExit);
  confirmExitRef.current = confirmExit;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (Keyboard.isVisible?.()) { Keyboard.dismiss(); return true; }
      if (restExpanded) { setRestExpanded(false); return true; }
      confirmExitRef.current();
      return true;
    });
    return () => handler.remove();
  }, [restExpanded]);

  const currentIndex = useMemo(() => {
    if (!currentLog) return -1;
    if (focusSet !== null && currentLog.sets[focusSet] && !currentLog.sets[focusSet].completed) return focusSet;
    return currentLog.sets.findIndex(s => !s.completed);
  }, [currentLog, focusSet]);

  // Replaces the sets of the exercise on screen; the exercise's own `completed` follows its sets.
  const updateCurrentSets = (update: (sets: SetLog[], exercise: ExerciseLog) => SetLog[]) => setLogs(current => current.map((exercise, eIndex) => {
    if (eIndex !== activeExerciseIndex) return exercise;
    const sets = update(exercise.sets, exercise);
    return { ...exercise, sets, completed: sets.every(s => s.completed) };
  }));
  const stopTimer = (key: string) => { if (timerRunning[key]) toggleTimer(key); };

  // The lock-screen notification names what comes after this rest, e.g. "Bench Press · 85 kg × 6".
  const nextSetLabel = (completedIndex: number): string | undefined => {
    const k = currentLog.sets.findIndex((s, j) => j !== completedIndex && !s.completed);
    if (k >= 0) return `${currentExercise.name} · ${describeSet(currentExercise, currentLog.sets[k])}`;
    const later = firstOpenAfter(template, logs, activeExerciseIndex);
    return later ? `${later.exercise.name} · ${describeSet(later.exercise, later.set)}` : undefined;
  };

  const toggleSetComplete = (i: number) => {
    const key = `${activeExerciseIndex}-${i}`;
    const completing = !currentLog.sets[i].completed;
    updateCurrentSets((sets, exercise) => sets.map((s, sIndex) => {
      if (sIndex !== i) return s;
      const toggled = { ...s, completed: completing };
      return completing ? withTimedDuration(exercise, toggled, timers[key]) : toggled;
    }));
    stopTimer(key);
    if (!completing) { void Haptics.selectionAsync(); setFocusSet(i); return; }
    const exerciseDone = currentLog.sets.every((s, j) => j === i || s.completed);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (exerciseDone) setTimeout(() => { void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }, 260);
    setLights(l => ({ n: l.n + 1, exercise: activeExerciseIndex, set: i, at: Date.now() }));
    if (focusSet === i) setFocusSet(null);
    const seconds = currentExercise.restSeconds ?? DEFAULT_REST_SECONDS;
    if (seconds > 0 && !(exerciseDone && isLast)) startRest(seconds, nextSetLabel(i));
  };
  const updateSet = (i: number, field: keyof SetLog, value: SetLog[keyof SetLog]) =>
    updateCurrentSets(sets => sets.map((s, sIndex) => (sIndex === i ? { ...s, [field]: value } : s)));
  const toggleSetTimer = (i: number) => {
    const key = `${activeExerciseIndex}-${i}`;
    if (timerRunning[key] && timers[key] > 0) updateSet(i, 'durationSeconds', timers[key]);
    toggleTimer(key);
  };
  // "Use last weight": the open sets of this exercise go back to last time's values; completed sets stay as lifted.
  const revertToLast = () => {
    updateCurrentSets(sets => sets.map((s, i) => (s.completed ? s : { ...s, ...prefill(currentExercise, i, historySets) })));
    void Haptics.selectionAsync();
  };
  const updateDefaultWeight = (weight: number) => {
    if (!Number.isFinite(weight) || weight < 0) return;
    onUpdateTemplate({ ...template, exercises: template.exercises.map(exercise => exercise.id === currentExercise.id ? { ...exercise, targetWeight: weight } : exercise) });
  };
  // "Mark all sets done": open sets complete at their entered values (the routine target fills a gap), running timers stop.
  const quickFinish = () => {
    const bodyweight = currentExercise.loadMode === 'bodyweight';
    updateCurrentSets((sets, exercise) => sets.map((s, i) => withTimedDuration(exercise, {
      ...s, completed: true,
      reps: s.reps ?? currentExercise.targetReps,
      weight: bodyweight ? undefined : (s.weight ?? currentExercise.targetWeight),
    }, timers[`${activeExerciseIndex}-${i}`])));
    currentLog.sets.forEach((_, i) => stopTimer(`${activeExerciseIndex}-${i}`));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLights(l => ({ n: l.n + 1, exercise: activeExerciseIndex, set: -1, at: Date.now() }));
    setFocusSet(null);
  };
  const go = (delta: number) => {
    const target = activeExerciseIndex + delta;
    if (target < 0 || target >= template.exercises.length) return;
    direction.current = delta;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFocusSet(null);
    setActiveExerciseIndex(target);
  };
  const next = () => { if (isLast) finishWorkout(); else go(1); };
  const prev = () => go(-1);

  // What the lifter does after this rest: the next open set here, else the first open set of a later exercise.
  const restNext = useMemo<RestNext | null>(() => {
    const make = (ex: Exercise, set: SetLog, title: string): RestNext => ({
      title, load: describeSet(ex, set),
      barWeight: ex.type === 'reps' && (ex.loadMode || 'external') === 'external' && (set.weight || 0) > BAR_KG ? set.weight : undefined,
    });
    if (!currentExercise || !currentLog) return null;
    if (currentIndex >= 0) return make(currentExercise, currentLog.sets[currentIndex], `Set ${currentIndex + 1} of ${currentLog.sets.length}`);
    const later = firstOpenAfter(template, logs, activeExerciseIndex);
    return later ? make(later.exercise, later.set, later.exercise.name) : null;
  }, [currentExercise, currentLog, currentIndex, activeExerciseIndex, logs, template]);

  const totals = useMemo(() => logs.reduce((acc, e) => ({ done: acc.done + e.sets.filter(s => s.completed).length, all: acc.all + e.sets.length }), { done: 0, all: 0 }), [logs]);

  if (!currentExercise || !currentLog) {
    return <View style={styles.container}>
      <EmptyState icon={Zap} title="Nothing to train yet" message="This routine has no exercises. Add at least one exercise before starting."
        action="Leave session" onAction={() => onFinish(null)} />
    </View>;
  }

  const nextExercise = template.exercises[activeExerciseIndex + 1];
  const doneLabel = nextExercise ? `Next: ${nextExercise.name} · ${targetLabel(nextExercise)}` : 'Last exercise of the routine.';
  const translateX = reduced ? 0 : enter.interpolate({ inputRange: [0, 1], outputRange: [16 * direction.current, 0] });
  const restProps = {
    restEndsAt, restTotal, next: restNext,
    onAdd: () => adjustRest(REST_STEP_SECONDS), onSubtract: () => adjustRest(-REST_STEP_SECONDS), onSkip: cancelRest,
  };
  const lightsFresh = lights.exercise === activeExerciseIndex && Date.now() - lights.at < LIGHTS_WINDOW_MS;

  return <View style={styles.container}>
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <ElapsedClock startTime={startTime} />
        <View style={styles.headerMeta}>
          <Text numberOfLines={1} style={styles.routineName}>{template.name}</Text>
          <Text style={styles.setCount}>{totals.done} of {totals.all} sets</Text>
          {!!lastRoutineLog && <RoutinePace logs={logs} previous={lastRoutineLog} style={styles.pace} />}
        </View>
        <PressableScale scaleTo={0.95} accessibilityRole="button" accessibilityLabel="End session" onPress={confirmExit} style={styles.end}>
          <Text style={styles.endText}>End</Text>
        </PressableScale>
      </View>
      <SessionProgress logs={logs} activeExerciseIndex={activeExerciseIndex} done={totals.done} all={totals.all} />
    </View>

    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: enter, transform: [{ translateX }] }}>
          <ExerciseView exercise={currentExercise} index={activeExerciseIndex} total={template.exercises.length}
            setNumber={currentIndex >= 0 ? currentIndex + 1 : undefined} setCount={currentLog.sets.length} />
          <SetList exercise={currentExercise} sets={currentLog.sets} historySets={historySets} exerciseIndex={activeExerciseIndex}
            suggestion={suggestions[activeExerciseIndex]} onUseLastValues={revertToLast}
            timers={timers} timerRunning={timerRunning} currentIndex={currentIndex}
            lightsTrigger={lightsFresh ? lights.n : 0} lightsSet={lights.set} nextLabel={doneLabel}
            onUpdateSet={updateSet} onSetDefaultWeight={updateDefaultWeight} onToggleComplete={toggleSetComplete}
            onFocusSet={setFocusSet} onCompleteAll={quickFinish} onToggleTimer={toggleSetTimer} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>

    <RestDock visible={isResting} onExpand={() => setRestExpanded(true)} {...restProps} />
    <SafeAreaView edges={['bottom']} style={styles.footer}>
      <PressableScale scaleTo={0.92} accessibilityRole="button" accessibilityLabel="Previous exercise" accessibilityState={{ disabled: activeExerciseIndex === 0 }}
        disabled={activeExerciseIndex === 0} onPress={prev} style={[styles.prev, activeExerciseIndex === 0 && styles.disabled]}>
        <ChevronLeft size={24} color={theme.colors.text} />
      </PressableScale>
      <View style={styles.flex}><Button label={isLast ? 'Finish session' : 'Next exercise'} onPress={next} style={styles.next} /></View>
    </SafeAreaView>

    {isResting && restExpanded && <RestOverlay onMinimise={() => setRestExpanded(false)} {...restProps} />}
  </View>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.canvas },
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, backgroundColor: theme.colors.canvas },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clock: { ...theme.type.metric, fontVariant: ['tabular-nums'], color: theme.colors.text, minWidth: 72 },
  headerMeta: { flex: 1, minWidth: 0 },
  routineName: { ...theme.type.label, color: theme.colors.text },
  setCount: { ...theme.type.caption, color: theme.colors.textMuted, fontVariant: ['tabular-nums'], marginTop: 1 },
  pace: { marginTop: 1 },
  end: { minWidth: 64, height: 44, paddingHorizontal: 16, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  endText: { ...theme.type.label, color: theme.colors.text },
  progress: { flexDirection: 'row', gap: 2, height: 4, marginTop: 10 },
  segment: { flex: 1, height: 4, borderRadius: 1, backgroundColor: theme.colors.surfaceElevated },
  segmentCurrent: { backgroundColor: theme.colors.borderStrong },
  segmentDone: { backgroundColor: theme.colors.done },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, maxWidth: 620, width: '100%', alignSelf: 'center' },
  footer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', gap: 8, backgroundColor: theme.colors.canvas },
  prev: { width: 56, height: 56, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  next: { minHeight: 56 },
});
