import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, Zap } from 'lucide-react-native';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Exercise, ExerciseLog, SetLog, WorkoutLog, WorkoutTemplate } from '../../types';
import { generateId } from '../../utils/helpers';
import { ActiveSession, saveActiveSession } from '../../utils/activeSession';
import { useWorkoutTimer } from '../../hooks/useWorkoutTimer';
import { RestDock, RestNext, RestOverlay } from './RestControl';
import { ExerciseView, targetLabel } from './ExerciseView';
import { describeSet, SetList } from './SetList';
import { Button, EmptyState, PressableScale, useReducedMotion } from '../../components/ui/Primitives';
import { showAlert } from '../../components/ui/Dialog';
import { theme } from '../../constants/theme';

interface Props {
  template: WorkoutTemplate; resume?: ActiveSession | null; previousLogs: WorkoutLog[];
  onUpdateTemplate: (template: WorkoutTemplate) => void; onFinish: (log: WorkoutLog | null) => void;
}

const byRecent = (logs: WorkoutLog[]) => [...logs].sort((a, b) => (b.endTime || b.startTime) - (a.endTime || a.startTime));

// The most recent performance of this exercise: matched by id, then by name.
const lastSetsFor = (exercise: Exercise, recent: WorkoutLog[]): SetLog[] | undefined => {
  for (const log of recent) {
    const hit = log.exercises.find(e => e.exerciseId === exercise.id) || log.exercises.find(e => e.exerciseName.toLowerCase() === exercise.name.toLowerCase());
    if (hit?.sets.length) return hit.sets;
  }
  return undefined;
};

// Sets start from what the lifter did last time, set for set; the routine target fills any gap.
const buildLogs = (template: WorkoutTemplate, recent: WorkoutLog[]): ExerciseLog[] => template.exercises.map(e => {
  const mode = e.type === 'reps' ? (e.loadMode || 'external') : undefined;
  const last = e.type === 'reps' ? lastSetsFor(e, recent) : undefined;
  return {
    exerciseId: e.id, exerciseName: e.name, exerciseType: e.type, loadMode: mode, distanceUnit: e.targetDistanceUnit, completed: false,
    sets: Array.from({ length: Math.min(100, Math.max(1, Math.floor(e.targetSets ?? 1))) }, (_, i) => {
      const h = last?.[i];
      const reps = h && (h.reps ?? 0) > 0 ? h.reps : e.targetReps;
      const weight = mode === 'bodyweight' ? undefined : h && typeof h.weight === 'number' && h.weight > 0 ? h.weight : e.targetWeight;
      return { setNumber: i + 1, completed: false, reps, weight, distance: e.targetDistance, durationSeconds: e.targetDurationSeconds, notes: '' };
    }),
  };
});

const clock = (seconds: number) => {
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  const ss = s.toString().padStart(2, '0');
  return h ? `${h}:${m.toString().padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};

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
  const [logs, setLogs] = useState<ExerciseLog[]>(() => resume?.logs ?? buildLogs(template, recent));
  const [restExpanded, setRestExpanded] = useState(false);
  const [focusSet, setFocusSet] = useState<number | null>(null);
  // Judge lights play for the set just completed (set -1: the whole exercise), on that exercise only, and only once.
  const [lights, setLights] = useState({ n: 0, exercise: -1, set: -1, at: 0 });
  const { timers, timerRunning, restTimer, restEndsAt, restTotal, isResting, toggleTimer, startRest, cancelRest, adjustRest } = useWorkoutTimer();
  const currentExercise = template.exercises[activeExerciseIndex], currentLog = logs[activeExerciseIndex];
  const isLast = activeExerciseIndex === template.exercises.length - 1;

  const scrollRef = useRef<ScrollView>(null);
  const enter = useRef(new Animated.Value(1)).current;
  const direction = useRef(1);
  const firstRender = useRef(true);

  // Never strand the footer behind an expanded rest that has ended or been skipped.
  useEffect(() => { if (!isResting) setRestExpanded(false); }, [isResting]);

  // Write-through so a reload or app kill never loses the session.
  useEffect(() => {
    const id = setTimeout(() => { void saveActiveSession({ template, startTime, activeExerciseIndex, logs }); }, 300);
    return () => clearTimeout(id);
  }, [template, startTime, activeExerciseIndex, logs]);

  // New exercise: back to the top, content slides in from the side it came from.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    enter.setValue(0);
    const anim = Animated.timing(enter, { toValue: 1, duration: reduced ? 160 : 220, easing: theme.motion.easeOut, useNativeDriver: theme.motion.nativeDriver });
    anim.start();
    return () => anim.stop();
  }, [activeExerciseIndex, enter, reduced]);

  const historySets = useMemo(() => (currentExercise ? lastSetsFor(currentExercise, recent) : undefined), [currentExercise, recent]);

  const finishWorkout = () => {
    cancelRest();
    onFinish({
      id: generateId(), templateId: template.id, templateName: template.name, source: 'routine', startTime, endTime: Date.now(),
      exercises: logs.map((e, eIndex) => ({
        ...e,
        sets: e.sets.map((set, setIndex) => { const elapsed = timers[`${eIndex}-${setIndex}`] || 0; return e.exerciseType === 'timer' && elapsed > 0 ? { ...set, durationSeconds: elapsed } : set; }),
        completed: e.sets.length > 0 && e.sets.every(s => s.completed),
      })),
    });
  };
  const confirmExit = () => showAlert('End this session?', 'Save the sets you have logged, or discard this session.', [
    { text: 'Keep training', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => onFinish(null) }, { text: 'Save & end', onPress: finishWorkout },
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

  const toggleSetComplete = (i: number) => {
    const key = `${activeExerciseIndex}-${i}`, wasRunning = timerRunning[key] === true;
    const set = currentLog.sets[i], completing = !set.completed;
    setLogs(current => current.map((exercise, eIndex) => {
      if (eIndex !== activeExerciseIndex) return exercise;
      const sets = exercise.sets.map((s, sIndex) => sIndex === i ? { ...s, completed: !s.completed, ...(exercise.exerciseType === 'timer' && !s.completed && timers[key] > 0 ? { durationSeconds: timers[key] } : {}) } : s);
      return { ...exercise, sets, completed: sets.every(s => s.completed) };
    }));
    if (wasRunning) toggleTimer(key);
    if (!completing) { void Haptics.selectionAsync(); setFocusSet(i); return; }
    const exerciseDone = currentLog.sets.every((s, j) => j === i || s.completed);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (exerciseDone) setTimeout(() => { void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }, 260);
    setLights(l => ({ n: l.n + 1, exercise: activeExerciseIndex, set: i, at: Date.now() }));
    if (focusSet === i) setFocusSet(null);
    const seconds = currentExercise.restSeconds ?? 60;
    if (seconds > 0 && !(exerciseDone && isLast)) startRest(seconds);
  };
  const updateSet = (i: number, field: keyof SetLog, value: SetLog[keyof SetLog]) => setLogs(current => current.map((e, eIndex) => eIndex === activeExerciseIndex ? { ...e, sets: e.sets.map((s, sIndex) => sIndex === i ? { ...s, [field]: value } : s) } : e));
  const updateDefaultWeight = (weight: number) => {
    if (!Number.isFinite(weight) || weight < 0) return;
    onUpdateTemplate({ ...template, exercises: template.exercises.map(exercise => exercise.id === currentExercise.id ? { ...exercise, targetWeight: weight } : exercise) });
  };
  const quickFinish = () => {
    setLogs(current => current.map((e, eIndex) => eIndex === activeExerciseIndex ? { ...e, completed: true, sets: e.sets.map((s, i) => ({ ...s, completed: true, reps: s.reps ?? currentExercise.targetReps, weight: currentExercise.loadMode === 'bodyweight' ? undefined : (s.weight ?? currentExercise.targetWeight), ...(e.exerciseType === 'timer' && (timers[`${eIndex}-${i}`] || 0) > 0 ? { durationSeconds: timers[`${eIndex}-${i}`] } : {}) })) } : e));
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
      barWeight: ex.type === 'reps' && (ex.loadMode || 'external') === 'external' && (set.weight || 0) > 20 ? set.weight : undefined,
    });
    if (!currentExercise || !currentLog) return null;
    if (currentIndex >= 0) return make(currentExercise, currentLog.sets[currentIndex], `Set ${currentIndex + 1} of ${currentLog.sets.length}`);
    for (let j = activeExerciseIndex + 1; j < logs.length; j++) {
      const k = logs[j].sets.findIndex(s => !s.completed);
      if (k >= 0) return make(template.exercises[j], logs[j].sets[k], template.exercises[j].name);
    }
    return null;
  }, [currentExercise, currentLog, currentIndex, activeExerciseIndex, logs, template.exercises]);

  const totals = useMemo(() => logs.reduce((acc, e) => ({ done: acc.done + e.sets.filter(s => s.completed).length, all: acc.all + e.sets.length }), { done: 0, all: 0 }), [logs]);

  if (!currentExercise || !currentLog) return <View style={styles.container}><EmptyState icon={Zap} title="Nothing to train yet" message="This routine has no exercises. Add at least one exercise before starting." action="Leave session" onAction={() => onFinish(null)} /></View>;

  const nextExercise = template.exercises[activeExerciseIndex + 1];
  const doneLabel = nextExercise ? `Next: ${nextExercise.name} · ${targetLabel(nextExercise)}` : 'Last exercise of the routine.';
  const translateX = reduced ? 0 : enter.interpolate({ inputRange: [0, 1], outputRange: [16 * direction.current, 0] });
  const restProps = { restTimer, restEndsAt, restTotal, next: restNext, onAdd: () => adjustRest(15), onSubtract: () => adjustRest(-15), onSkip: cancelRest };

  return <View style={styles.container}>
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <ElapsedClock startTime={startTime} />
        <View style={styles.headerMeta}>
          <Text numberOfLines={1} style={styles.routineName}>{template.name}</Text>
          <Text style={styles.setCount}>{totals.done} of {totals.all} sets</Text>
        </View>
        <PressableScale scaleTo={0.95} accessibilityRole="button" accessibilityLabel="End session" onPress={confirmExit} style={styles.end}>
          <Text style={styles.endText}>End</Text>
        </PressableScale>
      </View>
      <View style={styles.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: totals.all, now: totals.done }}>
        {totals.all <= 40
          ? logs.flatMap((e, ei) => e.sets.map((s, si) => <View key={`${ei}-${si}`} style={[styles.segment, s.completed && styles.segmentDone, ei === activeExerciseIndex && !s.completed && styles.segmentCurrent]} />))
          : <View style={[styles.segment, styles.segmentDone, { flex: 0, width: `${(totals.done / Math.max(1, totals.all)) * 100}%` }]} />}
      </View>
    </View>

    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: enter, transform: [{ translateX }] }}>
          <ExerciseView exercise={currentExercise} index={activeExerciseIndex} total={template.exercises.length}
            setNumber={currentIndex >= 0 ? currentIndex + 1 : undefined} setCount={currentLog.sets.length} />
          <SetList exercise={currentExercise} sets={currentLog.sets} historySets={historySets} exerciseIndex={activeExerciseIndex}
            timers={timers} timerRunning={timerRunning} currentIndex={currentIndex} lightsTrigger={lights.exercise === activeExerciseIndex && Date.now() - lights.at < 2500 ? lights.n : 0} lightsSet={lights.set} nextLabel={doneLabel}
            onUpdateSet={updateSet} onSetDefaultWeight={updateDefaultWeight} onToggleComplete={toggleSetComplete} onFocusSet={setFocusSet} onCompleteAll={quickFinish}
            onToggleTimer={i => { const key = `${activeExerciseIndex}-${i}`; if (timerRunning[key] && timers[key] > 0) updateSet(i, 'durationSeconds', timers[key]); toggleTimer(key); }} />
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
