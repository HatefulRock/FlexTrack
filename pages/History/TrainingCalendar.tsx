import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { addDays, format, isAfter, isSameDay, startOfDay, startOfWeek, subWeeks } from 'date-fns';
import { Card, PressableScale } from '../../components/ui/Primitives';
import { WorkoutLog, WorkoutTemplate } from '../../types';
import { theme } from '../../constants/theme';
import { CARDIO_COLOR, logColor } from '../../utils/workoutColor';
import { labelOn } from './historyModel';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKS = 4;

// One stripe per session that day, in that workout's colour, width = completed sets.
type Stripe = { key: string; name: string; color: string; sets: number };
const setsOf = (l: WorkoutLog) => Math.max(1, l.exercises.reduce((n, e) => n + e.sets.filter(s => s.completed).length, 0));

const DayCell = ({ day, today, shares, selected, onSelect }: { day: Date; today: Date; shares: Stripe[]; selected: Date | null; onSelect: (d: Date) => void }) => {
  const future = isAfter(day, today), isToday = isSameDay(day, today), isSelected = !!selected && isSameDay(selected, day);
  const fills = shares.map(s => s.color);
  const label = shares.length ? labelOn(fills) : { color: future ? theme.colors.textSubtle : theme.colors.textMuted, backed: false };
  const a11y = `${format(day, 'EEEE, MMMM d')}${isToday ? ', today' : ''}, ${shares.length ? shares.map(s => s.name).join(', ') : 'no session'}`;
  const body = <>
    {shares.length > 0 && <View style={styles.stripes}>{shares.map((s, i) => <View key={s.key} style={{ flex: s.sets, backgroundColor: fills[i] }} />)}</View>}
    <View style={[styles.labelWrap, label.backed && styles.labelBacked]}>
      {day.getDate() === 1 && <Text style={[styles.month, { color: label.color }]}>{format(day, 'MMM')}</Text>}
      <Text style={[styles.dayNum, { color: label.color }]}>{format(day, 'd')}</Text>
    </View>
  </>;
  return <View style={[styles.cellWrap, (isToday || isSelected) && styles.outlined, !!selected && !isSelected && styles.dimmed]}>
    {future ? <View style={[styles.cell, styles.cellFuture]}>{body}</View> :
      <PressableScale accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ selected: isSelected }} scaleTo={0.92}
        onPress={() => { Haptics.selectionAsync(); onSelect(day); }} style={[styles.cell, !shares.length && styles.cellEmpty]}>{body}</PressableScale>}
  </View>;
};

// The last four Sunday-to-Saturday weeks. A trained day is split into vertical stripes, one per session, in each workout's colour.
export const TrainingCalendar = ({ logs, templates = [], selected, onSelect }: { logs: WorkoutLog[]; templates?: WorkoutTemplate[]; selected: Date | null; onSelect: (d: Date) => void }) => {
  const todayMs = startOfDay(new Date()).getTime();
  const today = useMemo(() => new Date(todayMs), [todayMs]);
  const weeks = useMemo(() => {
    const first = startOfWeek(subWeeks(today, WEEKS - 1));
    return Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(first, w * 7 + d)));
  }, [today]);
  const byDay = useMemo(() => {
    const map = new Map<string, Stripe[]>();
    [...logs].sort((a, b) => a.startTime - b.startTime).forEach(l => {
      const key = new Date(l.startTime).toDateString();
      map.set(key, [...(map.get(key) || []), { key: l.id, name: l.templateName, color: logColor(l, templates), sets: setsOf(l) }]);
    });
    return map;
  }, [logs, templates]);
  // The legend names the workouts on screen, by colour; quick-logged cardio shares one grey entry.
  const present = useMemo(() => {
    const seen = new Map<string, string>();
    weeks.flat().forEach(d => byDay.get(d.toDateString())?.forEach(s => { const name = s.color === CARDIO_COLOR ? 'Cardio' : s.name; if (!seen.has(name)) seen.set(name, s.color); }));
    return [...seen].slice(0, 6);
  }, [weeks, byDay]);

  return <Card style={styles.card}>
    <View style={styles.head}>
      <Text accessibilityRole="header" style={styles.title}>Last {WEEKS} weeks</Text>
      {present.length > 0 && <View style={styles.legend}>{present.map(([name, color]) => <View key={name} style={styles.legendItem}>
        <View style={[styles.swatch, { backgroundColor: color }]} /><Text style={styles.legendText} numberOfLines={1}>{name}</Text>
      </View>)}</View>}
    </View>
    <View style={styles.row}>{WEEKDAYS.map((d, i) => <Text key={i} style={styles.weekday}>{d}</Text>)}</View>
    {weeks.map((week, w) => <View key={w} style={styles.row}>{week.map(day =>
      <DayCell key={day.toISOString()} day={day} today={today} shares={byDay.get(day.toDateString()) || []} selected={selected} onSelect={onSelect} />)}
    </View>)}
  </Card>;
};

const styles = StyleSheet.create({
  card: { padding: 12, gap: 4 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6, minHeight: 24 },
  title: { ...theme.type.label, color: theme.colors.text },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  legendText: { ...theme.type.caption, color: theme.colors.textMuted },
  row: { flexDirection: 'row', gap: 4 },
  weekday: { flex: 1, textAlign: 'center', ...theme.type.caption, color: theme.colors.textMuted, paddingVertical: 2 },
  cellWrap: { flex: 1, height: 52, borderRadius: theme.radius.md, borderWidth: 2, borderColor: 'transparent', padding: 2 },
  outlined: { borderColor: theme.colors.primary },
  dimmed: { opacity: 0.5 },
  cell: { height: 44, borderRadius: 3, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  cellEmpty: { backgroundColor: theme.colors.surfaceElevated },
  cellFuture: { backgroundColor: 'transparent' },
  stripes: { ...StyleSheet.absoluteFill, flexDirection: 'row' },
  labelWrap: { alignItems: 'center', justifyContent: 'center' },
  labelBacked: { backgroundColor: theme.colors.canvas, borderRadius: 2, paddingHorizontal: 4 },
  month: { fontFamily: theme.type.caption.fontFamily, fontSize: 12, lineHeight: 13 },
  dayNum: { fontFamily: theme.type.title.fontFamily, fontSize: 18, lineHeight: 20, fontVariant: ['tabular-nums'] },
});
