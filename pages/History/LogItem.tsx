import React, { useRef, useState } from 'react';
import { Animated, LayoutAnimation, Platform, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronDown } from 'lucide-react-native';
import { format } from 'date-fns';
import { ExerciseLog, SetLog, WorkoutLog } from '../../types';
import { formatTime } from '../../utils/time';
import { theme } from '../../constants/theme';
import { PressableScale, useReducedMotion } from '../../components/ui/Primitives';
import { CATEGORY_LABEL, categoryColor, estimate1RM, formatDuration, formatNumber, logVolume } from '../../utils/training';
import { ACTIVITY_LABEL, sessionCategories, sessionMs } from './historyModel';

const num = (n = 0) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const distanceText = (log: WorkoutLog) => {
  const e = log.exercises.find(x => x.sets.some(s => s.completed && (s.distance || 0) > 0));
  if (!e) return '';
  const total = e.sets.filter(s => s.completed).reduce((n, s) => n + (s.distance || 0), 0);
  return `${num(Math.round(total * 100) / 100)} ${e.distanceUnit || 'km'}`;
};

// Each completed set as text plus a score; the highest score is the best set.
const setEntries = (e: ExerciseLog): { text: string; score: number }[] => e.sets.filter(s => s.completed).map((s: SetLog) => {
  if (e.exerciseType === 'distance') return { text: `${num(s.distance)} ${e.distanceUnit || 'km'}${s.durationSeconds ? ` in ${formatTime(s.durationSeconds)}` : ''}`, score: s.distance || 0 };
  if (e.exerciseType === 'timer') { const d = s.durationSeconds || e.durationSeconds || 0; return { text: formatTime(d), score: d }; }
  if (e.loadMode === 'bodyweight' || !s.weight) return { text: `${s.reps || 0}`, score: s.reps || 0 };
  if (e.loadMode === 'assisted') return { text: `${s.reps || 0} at −${num(s.weight)} kg`, score: (s.reps || 0) * 1000 - (s.weight || 0) };
  return { text: `${num(s.weight)} × ${s.reps || 0}`, score: estimate1RM(s.weight, s.reps) || s.weight || 0 };
});

const SetLine = ({ e }: { e: ExerciseLog }) => {
  const entries = setEntries(e);
  if (!entries.length) return <Text style={styles.setsMuted}>Not completed</Text>;
  const best = entries.length > 1 ? entries.reduce((b, x, i) => (x.score > entries[b].score ? i : b), 0) : -1;
  const timed = e.exerciseType === 'distance' || e.exerciseType === 'timer';
  const unit = timed || e.loadMode === 'assisted' ? '' : entries.some(x => x.text.includes('×')) ? ' kg' : ' reps';
  return <Text style={styles.sets}>{entries.map((x, i) => <Text key={i}>
    <Text style={i === best ? styles.setBest : undefined}>{x.text}</Text>{i < entries.length - 1 ? ', ' : ''}
  </Text>)}{unit && <Text style={styles.setsMuted}>{unit}</Text>}</Text>;
};

export const LogItem = ({ log, first = false }: { log: WorkoutLog; first?: boolean }) => {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const turn = useRef(new Animated.Value(0)).current;
  const date = new Date(log.startTime);
  const shares = sessionCategories(log);
  const categoryText = shares.map(s => CATEGORY_LABEL[s.category]).join(' · ');
  const quick = log.source === 'quick';
  const volume = logVolume(log), distance = distanceText(log), ms = sessionMs(log);
  const meta = [
    quick ? ACTIVITY_LABEL[log.activityCategory || 'other'] : '',
    ms > 0 ? formatDuration(ms) : '',
    !quick || log.exercises.length ? `${log.exercises.filter(e => e.completed).length}/${log.exercises.length} exercises` : '',
    volume > 0 ? `${formatNumber(volume)} kg` : '',
    distance,
  ].filter(Boolean);

  const toggle = () => {
    Haptics.selectionAsync();
    if (Platform.OS !== 'web' && !reduced) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(turn, { toValue: open ? 0 : 1, duration: reduced ? 0 : theme.motion.base, easing: theme.motion.easeOut, useNativeDriver: theme.motion.nativeDriver }).start();
    setOpen(v => !v);
  };
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return <View style={[styles.item, !first && styles.divided]}>
    <PressableScale accessibilityRole="button" accessibilityState={{ expanded: open }} scaleTo={0.98} onPress={toggle}
      accessibilityLabel={`${log.templateName}, ${format(date, 'EEEE, MMMM d')}, ${shares.map(s => CATEGORY_LABEL[s.category]).join(' and ')}, ${meta.join(', ')}`} style={styles.row}>
      <View style={styles.dateBlock}>
        <Text style={styles.dateDay}>{format(date, 'd')}</Text>
        <Text style={styles.dateMonth}>{format(date, 'MMM')}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>{log.templateName}</Text>
        <View style={styles.sub}>
          <Text style={styles.subText}>{format(date, 'EEEE')}</Text>
          <View style={styles.swatches}>{shares.map(s => <View key={s.category} style={[styles.swatch, { backgroundColor: categoryColor(s.category) }]} />)}</View>
          <Text style={styles.subText} numberOfLines={1}>{categoryText}{quick ? ' · Quick log' : ''}</Text>
        </View>
        <Text style={styles.meta} numberOfLines={1}>{meta.join('  ·  ')}</Text>
      </View>
      <Animated.View style={{ transform: [{ rotate }] }}><ChevronDown size={20} color={theme.colors.textMuted} /></Animated.View>
    </PressableScale>
    {open && <View style={styles.details}>
      {log.exercises.map((e, i) => <View key={e.exerciseId || i} style={styles.exercise}>
        <Text style={styles.exerciseName}>{e.exerciseName}</Text>
        <SetLine e={e} />
      </View>)}
      {!log.exercises.length && <Text style={styles.setsMuted}>{quick ? `${ACTIVITY_LABEL[log.activityCategory || 'other']} logged without sets.` : 'No exercises recorded.'}</Text>}
      {!!log.notes && <Text style={styles.notes}>{log.notes}</Text>}
    </View>}
  </View>;
};

const styles = StyleSheet.create({
  item: { paddingHorizontal: 14 },
  divided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  row: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  dateBlock: { width: 40, alignItems: 'center' },
  dateDay: { ...theme.type.metric, fontVariant: ['tabular-nums'], fontSize: 30, lineHeight: 30, color: theme.colors.text },
  dateMonth: { ...theme.type.caption, color: theme.colors.textMuted },
  copy: { flex: 1, gap: 2 },
  title: { ...theme.type.heading, color: theme.colors.text },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  subText: { ...theme.type.caption, color: theme.colors.textMuted },
  swatches: { flexDirection: 'row', gap: 3, marginLeft: 2 },
  swatch: { width: 8, height: 8, borderRadius: 2 },
  meta: { ...theme.type.caption, fontFamily: theme.type.label.fontFamily, color: theme.colors.textSecondary, fontVariant: ['tabular-nums'], marginTop: 2 },
  details: { paddingLeft: 52, paddingBottom: 14, gap: 10 },
  exercise: { gap: 2 },
  exerciseName: { ...theme.type.label, color: theme.colors.text },
  sets: { ...theme.type.body, fontSize: 14, lineHeight: 20, color: theme.colors.textMuted, fontVariant: ['tabular-nums'] },
  setBest: { fontFamily: theme.type.button.fontFamily, color: theme.colors.text },
  setsMuted: { ...theme.type.caption, color: theme.colors.textMuted },
  notes: { ...theme.type.body, color: theme.colors.textMuted, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
});
