import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { addDays, format, isAfter, isSameDay, startOfDay, startOfWeek, subWeeks } from 'date-fns';
import { Card, PressableScale } from '../../components/ui/Primitives';
import { WorkoutLog } from '../../types';
import { theme } from '../../constants/theme';
import { CATEGORY_LABEL, categoryColor } from '../../utils/training';
import { CATEGORY_ORDER, CategoryShare, labelOn, mergeShares, sessionCategories } from './historyModel';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKS = 4;

const shareText = (s: CategoryShare) => `${CATEGORY_LABEL[s.category]} ${s.sets} ${s.sets === 1 ? 'set' : 'sets'}`;

const DayCell = ({ day, today, shares, selected, onSelect }: { day: Date; today: Date; shares: CategoryShare[]; selected: Date | null; onSelect: (d: Date) => void }) => {
  const future = isAfter(day, today), isToday = isSameDay(day, today), isSelected = !!selected && isSameDay(selected, day);
  const fills = shares.map(s => categoryColor(s.category));
  const label = shares.length ? labelOn(fills) : { color: future ? theme.colors.textSubtle : theme.colors.textMuted, backed: false };
  const a11y = `${format(day, 'EEEE, MMMM d')}${isToday ? ', today' : ''}, ${shares.length ? shares.map(shareText).join(', ') : 'no session'}`;
  const body = <>
    {shares.length > 0 && <View style={styles.stripes}>{shares.map((s, i) => <View key={s.category} style={{ flex: s.sets, backgroundColor: fills[i] }} />)}</View>}
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

// The last four Sunday-to-Saturday weeks. A trained day is split into vertical stripes, one per category it trained, width = completed sets.
export const TrainingCalendar = ({ logs, selected, onSelect }: { logs: WorkoutLog[]; selected: Date | null; onSelect: (d: Date) => void }) => {
  const todayMs = startOfDay(new Date()).getTime();
  const today = useMemo(() => new Date(todayMs), [todayMs]);
  const weeks = useMemo(() => {
    const first = startOfWeek(subWeeks(today, WEEKS - 1));
    return Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(first, w * 7 + d)));
  }, [today]);
  const byDay = useMemo(() => {
    const lists = new Map<string, CategoryShare[][]>();
    logs.forEach(l => { const key = new Date(l.startTime).toDateString(); lists.set(key, [...(lists.get(key) || []), sessionCategories(l)]); });
    const map = new Map<string, CategoryShare[]>();
    lists.forEach((v, k) => map.set(k, mergeShares(v)));
    return map;
  }, [logs]);
  const present = useMemo(() => CATEGORY_ORDER.filter(c => weeks.flat().some(d => byDay.get(d.toDateString())?.some(s => s.category === c))), [weeks, byDay]);

  return <Card style={styles.card}>
    <View style={styles.head}>
      <Text accessibilityRole="header" style={styles.title}>Last {WEEKS} weeks</Text>
      {present.length > 0 && <View style={styles.legend}>{present.map(c => <View key={c} style={styles.legendItem}>
        <View style={[styles.swatch, { backgroundColor: categoryColor(c) }]} /><Text style={styles.legendText}>{CATEGORY_LABEL[c]}</Text>
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
  stripes: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  labelWrap: { alignItems: 'center', justifyContent: 'center' },
  labelBacked: { backgroundColor: theme.colors.canvas, borderRadius: 2, paddingHorizontal: 4 },
  month: { fontFamily: theme.type.caption.fontFamily, fontSize: 12, lineHeight: 13 },
  dayNum: { fontFamily: theme.type.title.fontFamily, fontSize: 18, lineHeight: 20, fontVariant: ['tabular-nums'] },
});
