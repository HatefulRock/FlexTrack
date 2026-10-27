import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, MessageSquare, MessageSquarePlus, Minus, Pause, Play, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Exercise, SetLog } from '../../types';
import { formatTime, parseTimeString } from '../../utils/time';
import { fonts, theme } from '../../constants/theme';
import { Button, PressableScale, useReducedMotion } from '../../components/ui/Primitives';
import { Barbell } from './Barbell';
import { PaceMark, paceDelta, paceLabel } from './PaceParts';
import { ProgressionChip } from './ProgressionChip';
import { ProgressionSuggestion } from '../../utils/progression';

interface Props {
  exercise: Exercise; sets: SetLog[]; historySets?: SetLog[]; exerciseIndex: number;
  timers: Record<string, number>; timerRunning: Record<string, boolean>;
  currentIndex: number; lightsTrigger: number; lightsSet?: number; nextLabel?: string;
  suggestion?: ProgressionSuggestion | null; onUseLastValues?: () => void;
  onUpdateSet: (index: number, field: keyof SetLog, value: SetLog[keyof SetLog]) => void; onSetDefaultWeight: (weight: number) => void;
  onToggleComplete: (index: number) => void; onToggleTimer: (index: number) => void; onFocusSet: (index: number) => void; onCompleteAll: () => void;
}

export const fmtNum = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));
const loadMode = (e: Exercise) => e.loadMode || 'external';

// "85 kg × 6", "8 reps", "0:45", "5 km · 24:10": the set as the lifter says it.
export const describeSet = (exercise: Exercise, set: Pick<SetLog, 'reps' | 'weight' | 'distance' | 'durationSeconds'>, elapsed = 0) => {
  if (exercise.type === 'timer') return formatTime(elapsed || set.durationSeconds || 0);
  if (exercise.type === 'distance') return `${fmtNum(set.distance || 0)} ${exercise.targetDistanceUnit || 'km'}${set.durationSeconds ? ` · ${formatTime(set.durationSeconds)}` : ''}`;
  const reps = set.reps || 0;
  if (loadMode(exercise) === 'bodyweight') return `${reps} reps`;
  if (loadMode(exercise) === 'assisted') return `${reps} reps · ${fmtNum(set.weight || 0)} kg assist`;
  return `${fmtNum(set.weight || 0)} kg × ${reps}`;
};

// Three white judges' lights: a good lift. They play on the set just completed, never on the set still to lift.
// `hold` keeps them lit (an exercise with every set done); `bare` drops the unlit sockets so a row only shows them while they burn.
const JudgeLights = ({ trigger, hold = false, bare = false }: { trigger: number; hold?: boolean; bare?: boolean }) => {
  const lights = useRef([0, 1, 2].map(() => new Animated.Value(hold ? 1 : 0))).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!trigger) return;
    lights.forEach(v => v.setValue(0));
    const t = (v: Animated.Value, toValue: number, duration: number) => Animated.timing(v, { toValue, duration, easing: theme.motion.easeOut, useNativeDriver: theme.motion.nativeDriver });
    const on = Animated.stagger(80, lights.map(v => t(v, 1, 200)));
    const anim = hold ? on : Animated.sequence([on, Animated.delay(1400), Animated.parallel(lights.map(v => t(v, 0, 300)))]);
    const beats = [0, 1, 2].map(i => setTimeout(() => { void Haptics.selectionAsync(); }, 40 + i * 80));
    anim.start();
    return () => { anim.stop(); beats.forEach(clearTimeout); };
  }, [trigger, lights, hold]);
  return <View style={styles.lights} accessible={false} importantForAccessibility="no-hide-descendants">
    {lights.map((v, i) => <View key={i} style={[styles.light, bare && styles.lightBare]}>
      <Animated.View style={[styles.lightOn, { opacity: v, transform: reduced ? [] : [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]} />
    </View>)}
  </View>;
};

const NumberStepper = ({ label, unit, value, step, onChange, onEdit }: { label: string; unit: string; value?: number; step: number; onChange: (v: number) => void; onEdit?: () => void }) => {
  const [text, setText] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const display = text ?? (value === undefined ? '' : fmtNum(value));
  const bump = (d: number) => {
    void Haptics.selectionAsync();
    setText(null);
    onEdit?.();
    onChange(Math.max(0, Math.round(((value ?? 0) + d) * 100) / 100));
  };
  return <View style={styles.stepper}>
    <PressableScale scaleTo={0.92} accessibilityRole="button" accessibilityLabel={`Decrease ${label} by ${fmtNum(step)}`} onPress={() => bump(-step)} style={styles.stepBtn}>
      <Minus size={24} color={theme.colors.text} strokeWidth={2.5} />
    </PressableScale>
    <View style={[styles.stepValue, focused && styles.stepValueFocused]}>
      <TextInput accessibilityLabel={label} value={display} placeholder="0" placeholderTextColor={theme.colors.textSubtle}
        onFocus={() => { setFocused(true); setText(display); }} onBlur={() => { setFocused(false); setText(null); }}
        onChangeText={t => { const clean = t.replace(',', '.').replace(/[^0-9.]/g, ''); setText(clean); onEdit?.(); const n = parseFloat(clean); onChange(Number.isFinite(n) ? n : 0); }}
        keyboardType="decimal-pad" selectTextOnFocus style={styles.stepInput} />
      <Text style={styles.stepUnit}>{unit}</Text>
    </View>
    <PressableScale scaleTo={0.92} accessibilityRole="button" accessibilityLabel={`Increase ${label} by ${fmtNum(step)}`} onPress={() => bump(step)} style={styles.stepBtn}>
      <Plus size={24} color={theme.colors.text} strokeWidth={2.5} />
    </PressableScale>
  </View>;
};

export const SetList = ({ exercise, sets, historySets, exerciseIndex, timers, timerRunning, currentIndex, lightsTrigger, lightsSet = -1, nextLabel, suggestion, onUseLastValues, onUpdateSet, onSetDefaultWeight, onToggleComplete, onToggleTimer, onFocusSet, onCompleteAll }: Props) => {
  const [notes, setNotes] = useState<Record<string, boolean>>({});
  const [defaultCandidate, setDefaultCandidate] = useState<{ exerciseId: string; setIndex: number } | null>(null);
  const mode = loadMode(exercise);
  const lastTime = (i: number) => { const h = historySets?.[i]; return h ? `Last ${paceLabel(exercise, h)}` : 'No previous session'; };
  const lastSpoken = (i: number) => { const h = historySets?.[i]; return h ? `, last time ${describeSet(exercise, h)}` : ''; };
  // The chip explains a prefilled progression; once the lifter changes that value it is their number, and the delta mark takes over.
  const offersProgression = (set: SetLog) => !!suggestion && !set.completed && set.reps === suggestion.reps && (mode === 'bodyweight' || set.weight === suggestion.weight);
  const distanceStep = exercise.targetDistanceUnit === 'm' ? 100 : exercise.targetDistanceUnit === 'miles' ? 0.25 : 0.5;

  const renderCard = (i: number) => {
    const set = sets[i], key = `${exerciseIndex}-${i}`, running = !!timerRunning[key], elapsed = timers[key] || 0;
    const changedWeight = defaultCandidate?.exerciseId === exercise.id && defaultCandidate.setIndex === i && exercise.type === 'reps' && mode !== 'bodyweight'
      && typeof set.weight === 'number' && Number.isFinite(set.weight) && set.weight !== (exercise.targetWeight ?? 0);
    const weightEdit = () => setDefaultCandidate({ exerciseId: exercise.id, setIndex: i });
    const chip = suggestion && onUseLastValues && offersProgression(set);
    const live = exercise.type === 'timer' ? [] : paceDelta(exercise, set, historySets?.[i]);
    return <View key="current-card" style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={[styles.lastTime, !historySets?.[i] && styles.lastTimeNone]} numberOfLines={1}>{lastTime(i)}</Text>
        {chip ? <ProgressionChip exercise={exercise} suggestion={suggestion} onUseLast={onUseLastValues} /> : <PaceMark parts={live} />}
        <JudgeLights trigger={0} />
      </View>

      {exercise.type === 'reps' && <>
        {mode === 'external' && ((set.weight || 0) > 20 ? <Barbell weight={set.weight || 0} /> : <View style={styles.emptyBar}><Text style={styles.emptyBarText}>Empty bar</Text></View>)}
        <View style={styles.steppers}>
          {mode !== 'bodyweight' && <NumberStepper label={mode === 'assisted' ? 'Assistance' : 'Weight'} unit={mode === 'assisted' ? 'kg assist' : 'kg'} value={set.weight} step={2.5}
            onEdit={weightEdit} onChange={v => onUpdateSet(i, 'weight', v)} />}
          <NumberStepper label="Reps" unit="reps" value={set.reps} step={1} onChange={v => onUpdateSet(i, 'reps', Math.round(v))} />
        </View>
      </>}

      {exercise.type === 'timer' && <View style={styles.timerBlock}>
        <Text accessibilityRole="timer" style={styles.timerValue}>{formatTime(elapsed)}</Text>
        {!!exercise.targetDurationSeconds && <Text style={styles.timerTarget}>Target {formatTime(exercise.targetDurationSeconds)}</Text>}
        <Button variant="secondary" icon={running ? Pause : Play} label={running ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start timer'} onPress={() => onToggleTimer(i)} style={styles.timerBtn} />
      </View>}

      {exercise.type === 'distance' && <View style={styles.steppers}>
        <NumberStepper label="Distance" unit={exercise.targetDistanceUnit || 'km'} value={set.distance} step={distanceStep} onChange={v => onUpdateSet(i, 'distance', v)} />
        <View style={styles.timeField}>
          <Text style={styles.timeLabel}>Time</Text>
          <TextInput accessibilityLabel="Time, minutes and seconds" defaultValue={set.durationSeconds ? formatTime(set.durationSeconds) : ''} placeholder="0:00" placeholderTextColor={theme.colors.textSubtle}
            onChangeText={v => onUpdateSet(i, 'durationSeconds', parseTimeString(v))} selectTextOnFocus style={styles.timeInput} />
        </View>
      </View>}

      <View style={styles.aux}>
        <PressableScale scaleTo={0.95} accessibilityRole="button" accessibilityLabel={set.notes ? 'Edit note' : 'Add note'} onPress={() => setNotes(n => ({ ...n, [key]: !n[key] }))} style={styles.auxBtn}>
          {set.notes ? <MessageSquare size={16} color={theme.colors.textSecondary} /> : <MessageSquarePlus size={16} color={theme.colors.textMuted} />}
          <Text style={styles.auxText}>{set.notes ? 'Note' : 'Add note'}</Text>
        </PressableScale>
        {changedWeight && <PressableScale scaleTo={0.97} accessibilityRole="button" accessibilityLabel={`Use ${set.weight} kilograms as the default for ${exercise.name}`}
          onPress={() => { setDefaultCandidate(null); onSetDefaultWeight(set.weight as number); }} style={styles.auxBtn}>
          <Text style={styles.defaultText}>Use {fmtNum(set.weight as number)} kg as default</Text>
        </PressableScale>}
      </View>
      {notes[key] && <TextInput autoFocus accessibilityLabel={`Note for set ${set.setNumber}`} placeholder="Note for this set" placeholderTextColor={theme.colors.textMuted}
        value={set.notes || ''} onChangeText={v => onUpdateSet(i, 'notes', v)} style={styles.noteInput} />}

      <Button label="Set done" icon={Check} accessibilityLabel={`Complete set ${set.setNumber}`} onPress={() => onToggleComplete(i)} style={styles.done} />
    </View>;
  };

  const doneCard = <View key="done-card" style={styles.card}>
    <View style={styles.cardTop}>
      <Text accessibilityRole="header" style={styles.allDone}>All {sets.length} sets done</Text>
      <JudgeLights trigger={lightsTrigger} hold />
    </View>
    {!!nextLabel && <Text style={styles.allDoneNext}>{nextLabel}</Text>}
  </View>;

  const rows: React.ReactNode[] = [];
  sets.forEach((set, i) => {
    const key = `${exerciseIndex}-${i}`;
    if (i === currentIndex) { rows.push(renderCard(i)); return; }
    const desc = describeSet(exercise, set, timers[key]);
    const last = historySets?.[i] ? <Text style={styles.rowLast} numberOfLines={1}>{lastTime(i)}</Text> : null;
    const delta = set.completed ? paceDelta(exercise, set, historySets?.[i]) : [];
    const deltaSpoken = delta.length ? `, ${delta.map(d => d.spoken).join(', ')}` : '';
    rows.push(set.completed
      ? <PressableScale key={key} scaleTo={0.98} accessibilityRole="checkbox" accessibilityState={{ checked: true }} accessibilityLabel={`Set ${set.setNumber} done, ${desc}${lastSpoken(i)}${deltaSpoken}. Tap to reopen`}
          onPress={() => onToggleComplete(i)} style={styles.row}>
          <Text style={styles.rowNum}>{set.setNumber}</Text>
          <View style={styles.rowBody}><Text style={styles.rowDone}>{desc}</Text>{last}</View>
          <PaceMark parts={delta} />
          {!!set.notes && <MessageSquare size={15} color={theme.colors.textMuted} />}
          {!!lightsTrigger && currentIndex >= 0 && i === lightsSet && <JudgeLights trigger={lightsTrigger} bare />}
          <View style={styles.tick}><Check size={16} color={theme.colors.onPrimary} strokeWidth={3.2} /></View>
        </PressableScale>
      : <PressableScale key={key} scaleTo={0.98} accessibilityRole="button" accessibilityLabel={`Set ${set.setNumber}, ${desc}${lastSpoken(i)}. Make current`}
          onPress={() => { void Haptics.selectionAsync(); onFocusSet(i); }} style={styles.row}>
          <Text style={[styles.rowNum, styles.rowDim]}>{set.setNumber}</Text>
          <View style={styles.rowBody}><Text style={styles.rowUpcoming}>{desc}</Text>{last}</View>
          <View style={styles.ring} />
        </PressableScale>);
  });
  if (currentIndex < 0) rows.push(doneCard);

  return <View>
    <View style={styles.list}>{rows}</View>
    {sets.some(s => !s.completed) && <PressableScale scaleTo={0.97} accessibilityRole="button" accessibilityLabel="Mark all sets of this exercise done" onPress={onCompleteAll} style={styles.completeAll}>
      <Text style={styles.completeAllText}>Mark all sets done</Text>
    </PressableScale>}
  </View>;
};

const inputWeb = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {};

const styles = StyleSheet.create({
  list: {},
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, gap: 12, marginVertical: 8 },
  cardTop: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  lastTime: { ...theme.type.body, color: theme.colors.textSecondary, flex: 1, fontVariant: ['tabular-nums'] },
  lastTimeNone: { color: theme.colors.textMuted },
  lights: { flexDirection: 'row', gap: 8 },
  light: { width: 14, height: 14, borderRadius: 7, backgroundColor: theme.colors.surfaceElevated },
  lightBare: { backgroundColor: 'transparent' },
  lightOn: { width: 14, height: 14, borderRadius: 7, backgroundColor: theme.colors.done },
  emptyBar: { height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.md, backgroundColor: theme.colors.canvas },
  emptyBarText: { ...theme.type.label, color: theme.colors.textMuted },
  steppers: { gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'stretch', gap: 8, height: 64 },
  stepBtn: { width: 56, height: 64, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  stepValue: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: theme.radius.sm, backgroundColor: theme.colors.canvas, borderWidth: 1, borderColor: theme.colors.borderStrong, paddingHorizontal: 8 },
  stepValueFocused: { borderColor: theme.colors.primary },
  stepInput: { flex: 1, minWidth: 0, height: 62, textAlign: 'right', fontFamily: fonts.display, fontSize: 48, color: theme.colors.text, fontVariant: ['tabular-nums'], padding: 0, ...inputWeb },
  stepUnit: { ...theme.type.label, color: theme.colors.textMuted, flex: 1, marginLeft: 8, marginTop: 10 },
  timerBlock: { alignItems: 'center', gap: 4 },
  timerValue: { ...theme.type.timer, fontVariant: ['tabular-nums'], fontSize: 72, lineHeight: 76, color: theme.colors.text },
  timerTarget: { ...theme.type.body, color: theme.colors.textMuted },
  timerBtn: { alignSelf: 'stretch', marginTop: 8, minHeight: 56 },
  timeField: { height: 64, flexDirection: 'row', alignItems: 'center', borderRadius: theme.radius.sm, backgroundColor: theme.colors.canvas, borderWidth: 1, borderColor: theme.colors.borderStrong, paddingHorizontal: 12 },
  timeLabel: { ...theme.type.label, color: theme.colors.textMuted, width: 56 },
  timeInput: { flex: 1, height: 62, textAlign: 'center', fontFamily: fonts.display, fontSize: 40, color: theme.colors.text, fontVariant: ['tabular-nums'], padding: 0, ...inputWeb },
  aux: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginVertical: -4 },
  auxBtn: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 4 },
  auxText: { ...theme.type.label, color: theme.colors.textMuted },
  defaultText: { ...theme.type.label, color: theme.colors.text, textDecorationLine: 'underline' },
  noteInput: { ...theme.type.body, minHeight: 44, borderRadius: theme.radius.sm, backgroundColor: theme.colors.canvas, borderWidth: 1, borderColor: theme.colors.borderStrong, color: theme.colors.text, paddingHorizontal: 12, ...inputWeb },
  done: { minHeight: 56 },
  allDone: { ...theme.type.heading, color: theme.colors.text, flex: 1 },
  allDoneNext: { ...theme.type.body, color: theme.colors.textMuted },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border, paddingHorizontal: 4 },
  rowNum: { ...theme.type.label, color: theme.colors.textMuted, width: 18, fontVariant: ['tabular-nums'] },
  rowDim: { color: theme.colors.textSubtle },
  rowBody: { flex: 1, minWidth: 0, paddingVertical: 6 },
  rowLast: { ...theme.type.caption, color: theme.colors.textSubtle, fontVariant: ['tabular-nums'] },
  rowDone: { fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 26, color: theme.colors.text, fontVariant: ['tabular-nums'] },
  rowUpcoming: { ...theme.type.body, color: theme.colors.textSubtle, fontVariant: ['tabular-nums'] },
  tick: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.done, alignItems: 'center', justifyContent: 'center' },
  ring: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: theme.colors.border },
  completeAll: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', marginTop: 8 },
  completeAllText: { ...theme.type.label, color: theme.colors.textMuted, textDecorationLine: 'underline' },
});
