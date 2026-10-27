import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { ExerciseLog } from '../../types';
import { theme } from '../../constants/theme';
import { CATEGORY_LABEL, RecordHit, categoryColor, exerciseCategory, formatDecimal as num } from '../../utils/training';
import { formatTime } from '../../utils/time';

const c = theme.colors;

// The judges' verdict on the session: a white light for each third of the sets done, red for the rest.
export const whiteLights = (done: number, total: number) => {
  if (total <= 0) return 0;
  if (done === total) return 3;
  if (done * 3 >= total * 2) return 2;
  return done * 3 >= total ? 1 : 0;
};
export const lightsVerdict = (white: number) => white === 3 ? 'Good lift · every set done'
  : white === 2 ? '2 of 3 lights · at least two-thirds of the sets done'
  : white === 1 ? '1 of 3 lights · at least a third of the sets done'
  : 'No white lights · under a third of the sets done';

export const JudgeLights = ({ scales, opacity, white }: { scales: Animated.Value[]; opacity: Animated.Value; white: number }) => (
  <Animated.View accessible accessibilityLabel={lightsVerdict(white)} style={[styles.verdict, { opacity }]}>
    <View style={styles.board}>
      {scales.map((s, i) => <Animated.View key={i} accessible accessibilityLabel={i < white ? 'white light' : 'red light'}
        style={[styles.light, i >= white && styles.lightRed, { transform: [{ scale: s }] }]} />)}
    </View>
  </Animated.View>
);

export const RECORD_KIND: Record<RecordHit['kind'], string> = { weight: 'Heaviest set', oneRM: 'Best estimated 1RM', reps: 'Most reps' };
export const recordValue = (r: RecordHit) => r.kind === 'reps' ? `${r.value} reps` : `${num(r.value)} kg`;
export const recordWas = (r: RecordHit) => r.kind === 'reps' ? `was ${r.previous}` : `was ${num(r.previous)} kg`;

// A record is a yellow plate: the whole band is the colour, the number is the scoreboard.
export const RecordCard = ({ record }: { record: RecordHit }) => (
  <View accessible accessibilityLabel={`New record. ${record.exerciseName}, ${RECORD_KIND[record.kind]}: ${recordValue(record)}, ${recordWas(record)}.`} style={styles.record}>
    <Text style={styles.recordName} numberOfLines={2}>{record.exerciseName}</Text>
    <Text style={styles.recordLine}>
      <Text style={styles.recordValue}>{recordValue(record)}</Text>
      <Text style={styles.recordWas}>{'   '}{RECORD_KIND[record.kind]} · {recordWas(record)}</Text>
    </Text>
  </View>
);

// The single best set of an exercise, printed the way a lifter says it: "85 × 6".
export const bestSet = (e: ExerciseLog): string => {
  const done = e.sets.filter(s => s.completed);
  if (!done.length) return '';
  if (e.exerciseType === 'timer') return formatTime(Math.max(0, ...done.map(s => s.durationSeconds || 0)));
  if (e.exerciseType === 'distance') return `${num(Math.max(0, ...done.map(s => s.distance || 0)))} ${e.distanceUnit || 'km'}`;
  const loaded = e.loadMode !== 'bodyweight' && e.loadMode !== 'assisted';
  if (!loaded) return `${Math.max(0, ...done.map(s => s.reps || 0))} reps`;
  const best = done.reduce((a, s) => ((s.weight || 0) > (a.weight || 0) || ((s.weight || 0) === (a.weight || 0) && (s.reps || 0) > (a.reps || 0)) ? s : a), done[0]);
  return best.weight ? `${num(best.weight)} × ${best.reps || 0}` : `${best.reps || 0} reps`;
};

export const ExerciseRow = ({ exercise, first }: { exercise: ExerciseLog; first: boolean }) => {
  const total = exercise.sets.length, count = exercise.sets.filter(s => s.completed).length;
  const done = total > 0 && count === total, skipped = count === 0, best = bestSet(exercise);
  const status = done ? `Done · ${count} ${count === 1 ? 'set' : 'sets'}` : skipped ? 'Skipped' : `${count} of ${total}`;
  const category = exerciseCategory(exercise.exerciseName, exercise.exerciseType);
  return <View accessible accessibilityLabel={`${exercise.exerciseName}, ${CATEGORY_LABEL[category]}. ${done ? 'Done' : skipped ? 'Skipped' : `Partial, ${count} of ${total} sets`}.${best ? ` Best set ${best.replace('×', 'by')}.` : ''}`}
    style={[styles.row, !first && styles.rowRule]}>
    {done ? <View style={[styles.tick, styles.tickLit]}><Check size={14} color={c.onPrimary} strokeWidth={3.2} /></View>
      : skipped ? <View style={[styles.tick, styles.tickRed]} />
      : <View style={[styles.tick, styles.tickHalf]}><View style={styles.tickHalfFill} /></View>}
    <View style={styles.rowCopy}>
      <View style={styles.nameLine}>
        <View style={[styles.category, { backgroundColor: categoryColor(category) }]} />
        <Text style={[styles.rowName, skipped && styles.muted]} numberOfLines={1}>{exercise.exerciseName}</Text>
      </View>
      <Text style={[styles.rowMeta, !done && !skipped && styles.rowPartial]}>{status}</Text>
    </View>
    {!!best && <Text style={styles.best}>{best}</Text>}
  </View>;
};

const styles = StyleSheet.create({
  verdict: { gap: 10, alignItems: 'flex-start' },
  board: { flexDirection: 'row', gap: 14, backgroundColor: c.surface, borderRadius: theme.radius.lg, paddingHorizontal: 16, paddingVertical: 14 },
  light: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.done },
  lightRed: { backgroundColor: c.dangerFill },
  record: { backgroundColor: c.record, borderRadius: theme.radius.lg, padding: 16, gap: 2 },
  recordName: { ...theme.type.heading, color: c.onRecord },
  recordLine: { color: c.onRecord },
  recordValue: { ...theme.type.display, color: c.onRecord, fontVariant: ['tabular-nums'] },
  recordWas: { ...theme.type.label, color: c.onRecord },
  row: { minHeight: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 12 },
  rowRule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  tick: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tickLit: { backgroundColor: c.done },
  tickRed: { backgroundColor: c.dangerFill },
  tickHalf: { backgroundColor: c.surfacePressed, overflow: 'hidden', alignItems: 'flex-start' },
  tickHalfFill: { width: 11, height: 22, backgroundColor: c.done },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  category: { width: 10, height: 10, borderRadius: 2 },
  rowCopy: { flex: 1, gap: 2 },
  rowName: { ...theme.type.label, color: c.text, flexShrink: 1 },
  rowMeta: { ...theme.type.caption, color: c.textMuted },
  rowPartial: { color: c.textSecondary },
  muted: { color: c.textMuted },
  best: { fontFamily: theme.type.metric.fontFamily, fontSize: 22, lineHeight: 26, color: c.text, fontVariant: ['tabular-nums'] },
});
