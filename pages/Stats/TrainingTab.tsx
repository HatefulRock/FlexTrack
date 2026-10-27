import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronDown, TrendingUp, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { startOfWeek, subWeeks } from 'date-fns';
import { WorkoutLog } from '../../types';
import { exerciseNames, metricOptions, metricValue, ProgressKind, resolveKind } from '../../utils/progress';
import { Category, CATEGORY_LABEL, categoryColor, exerciseCategory } from '../../utils/training';
import { EmptyState, PressableScale, SectionHeader } from '../../components/ui/Primitives';
import { Sheet } from '../../components/layout/Navigation';
import { theme } from '../../constants/theme';
import { chartScale, DAY_MS, formatMetric, metricText, shortDate } from './chartUtils';
import { ChartPoint, LineChartSvg } from './LineChartSvg';
import { HeatRow, HeatStrip } from './HeatStrip';

const WEEKS = 12;
const NEW_WINDOW = 14 * DAY_MS;
const RECORD_METRIC: Record<ProgressKind, { key: string; caption: string; better: 'high' | 'low' }> = {
  external: { key: 'weight', caption: 'Heaviest', better: 'high' },
  bodyweight: { key: 'bestReps', caption: 'Most reps', better: 'high' },
  assisted: { key: 'assistance', caption: 'Least assistance', better: 'low' },
  distance: { key: 'distance', caption: 'Longest', better: 'high' },
  timer: { key: 'duration', caption: 'Longest hold', better: 'high' },
};

interface RecordRow { name: string; category: Category; key: string; caption: string; value: number; date: number; isNew: boolean }

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const spanText = (ms: number) => { const days = Math.max(1, Math.round(ms / DAY_MS)); return days >= 14 ? plural(Math.round(days / 7), 'week') : plural(days, 'day'); };

const INSIGHT_WEEKS = 4;

// One sentence on push/pull/legs balance over the last four weeks (cardio counts entries, not comparable sets).
const balanceInsight = (counts: Record<Category, number[]>) => {
  const span = `the last ${INSIGHT_WEEKS} weeks`;
  const [top, mid, low] = (['push', 'pull', 'legs'] as Category[])
    .map(key => ({ key, n: counts[key].slice(-INSIGHT_WEEKS).reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.n - a.n);
  const name = (k: Category) => CATEGORY_LABEL[k], lower = (k: Category) => name(k).toLowerCase();
  if (!top.n) return `No push, pull or legs sets in ${span}.`;
  if (top.n === low.n) return `Push, pull and legs are level over ${span} (${plural(top.n, 'set')} each).`;
  if (top.n === mid.n) return `${name(top.key)} and ${lower(mid.key)} lead over ${span} (${plural(top.n, 'set')} each); ${lower(low.key)} trails (${low.n}).`;
  if (!mid.n) return `Only ${lower(top.key)} work in ${span} (${plural(top.n, 'set')}).`;
  const trailing = mid.n === low.n ? `${lower(mid.key)} and ${lower(low.key)} trail` : `${lower(low.key)} trails`;
  return `${name(top.key)} is your most trained category over ${span} (${plural(top.n, 'set')}); ${trailing} (${low.n}).`;
};

export const TrainingTab = ({ logs }: { logs: WorkoutLog[] }) => {
  const sorted = useMemo(() => logs.slice().sort((a, b) => a.startTime - b.startTime), [logs]);
  const names = useMemo(() => exerciseNames(logs), [logs]);
  const sessionsOf = useMemo(() => {
    const map = new Map<string, { t: number; e: WorkoutLog['exercises'][number] }[]>();
    sorted.forEach(l => l.exercises.forEach(e => { const list = map.get(e.exerciseName) || []; list.push({ t: l.startTime, e }); map.set(e.exerciseName, list); }));
    return map;
  }, [sorted]);
  const categoryOf = useCallback((name: string) => { const s = sessionsOf.get(name); return exerciseCategory(name, s?.[s.length - 1]?.e.exerciseType); }, [sessionsOf]);

  // Default to the lift with the most sessions, so the first chart has a line to draw.
  const [selected, setSelected] = useState('');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [metricIndex, setMetricIndex] = useState(0);
  const [showAllRecords, setShowAllRecords] = useState(false);
  useEffect(() => {
    if (selected && names.includes(selected)) return;
    const busiest = names.slice().sort((a, b) => (sessionsOf.get(b)?.length || 0) - (sessionsOf.get(a)?.length || 0))[0];
    setSelected(busiest || '');
  }, [names, selected, sessionsOf]);

  const selectedSessions = useMemo(() => sessionsOf.get(selected) || [], [sessionsOf, selected]);
  const kind = selectedSessions.length ? resolveKind(selectedSessions[selectedSessions.length - 1].e) : 'external';
  const options = metricOptions(kind);
  const option = options[Math.min(metricIndex, options.length - 1)];
  useEffect(() => setMetricIndex(0), [selected, kind]);

  const points = useMemo(() => {
    let best: number | null = null;
    return selectedSessions.map(({ t, e }) => ({ t, value: metricValue(e, option.key) })).filter((p): p is { t: number; value: number } => p.value !== null)
      .map((p): ChartPoint => {
        const beats = best !== null && (option.better === 'high' ? p.value > best : p.value < best);
        if (best === null || beats) best = p.value;
        return { ...p, record: beats };
      });
  }, [selectedSessions, option.key, option.better]);

  const records = useMemo(() => {
    const now = Date.now();
    return names.map((name): RecordRow | null => {
      const sessions = sessionsOf.get(name) || [];
      if (!sessions.length) return null;
      const m = RECORD_METRIC[resolveKind(sessions[sessions.length - 1].e)];
      const values = sessions.map(s => ({ t: s.t, v: metricValue(s.e, m.key) })).filter((x): x is { t: number; v: number } => x.v !== null);
      if (!values.length) return null;
      const best = m.better === 'low' ? Math.min(...values.map(x => x.v)) : Math.max(...values.map(x => x.v));
      const first = values.find(x => x.v === best)!;
      const isNew = now - first.t <= NEW_WINDOW && values.some(x => x.t < first.t);
      return { name, category: categoryOf(name), key: m.key, caption: m.caption, value: best, date: first.t, isNew };
    }).filter((r): r is RecordRow => !!r).sort((a, b) => b.date - a.date || a.name.localeCompare(b.name));
  }, [names, sessionsOf, categoryOf]);

  const heat = useMemo(() => {
    const now = new Date();
    const weeks = Array.from({ length: WEEKS }, (_, i) => startOfWeek(subWeeks(now, WEEKS - 1 - i)).getTime());
    const index = new Map(weeks.map((w, i) => [w, i]));
    const counts: Record<Category, number[]> = { push: [], pull: [], legs: [], cardio: [], other: [] };
    (Object.keys(counts) as Category[]).forEach(k => { counts[k] = Array(WEEKS).fill(0); });
    logs.forEach(l => {
      const c = index.get(startOfWeek(new Date(l.startTime)).getTime());
      if (c === undefined) return;
      let any = false;
      l.exercises.forEach(e => { const n = e.sets.filter(s => s.completed).length; if (n) { counts[exerciseCategory(e.exerciseName, e.exerciseType)][c] += n; any = true; } });
      if (!any && (l.activityCategory === 'run' || l.activityCategory === 'walk' || l.activityCategory === 'cycle')) counts.cardio[c] += 1;
    });
    const keys: Category[] = ['push', 'pull', 'legs', 'cardio', ...(counts.other.some(Boolean) ? ['other' as Category] : [])];
    const rows: HeatRow[] = keys.map(key => ({ key, values: counts[key] }));
    return { weeks, rows, insight: balanceInsight(counts) };
  }, [logs]);

  const scale = useMemo(() => chartScale(option.key, points.map(p => p.value)), [option.key, points]);
  const unit = scale.unit;

  if (!logs.length) return <EmptyState icon={TrendingUp} title="Nothing to chart yet" message="Finish a session and your records, weekly training and progression show up here." />;

  const visibleRecords = showAllRecords ? records : records.slice(0, 5);
  const first = points[0], last = points[points.length - 1];
  const diff = points.length > 1 ? last.value - first.value : 0;
  const better = option.better === 'high' ? diff > 0 : diff < 0;
  const deltaText = points.length > 1 ? (Math.abs(diff) < 1e-9 ? `No change in ${spanText(last.t - first.t)}` : `${diff > 0 ? '+' : '−'}${metricText(option.key, Math.abs(diff))} in ${spanText(last.t - first.t)}`) : '';
  const describe = points.length > 1 ? `${selected}, ${option.subtitle.toLowerCase()}, ${points.length} sessions from ${metricText(option.key, first.value)} on ${shortDate(first.t, true)} to ${metricText(option.key, last.value)} on ${shortDate(last.t, true)}.` : '';
  const hasRecordPoint = points.some(p => p.record);

  return <View style={styles.container}>
    {!!records.length && <View>
      <SectionHeader title="Records" />
      <View style={styles.card}>
        {visibleRecords.map((r, i) => {
          const m = formatMetric(r.key, r.value);
          return <View key={r.name} style={[styles.recordRow, i > 0 && styles.hairline]} accessible accessibilityLabel={`${r.name}, ${r.caption.toLowerCase()} ${m.value} ${m.unit}, ${shortDate(r.date, true)}${r.isNew ? ', new record' : ''}`}>
            <View style={[styles.dot, { backgroundColor: categoryColor(r.category) }]} />
            <View style={styles.recordName}>
              <Text style={styles.liftName} numberOfLines={1}>{r.name}</Text>
              <Text style={styles.caption}>{r.caption}</Text>
            </View>
            <View style={styles.recordValueCol}>
              <View style={[styles.valueMark, r.isNew && styles.valueMarkNew]}>
                <Text style={[styles.recordValue, r.isNew && styles.onRecord]}>{m.value}<Text style={[styles.recordUnit, r.isNew && styles.onRecord]}>{m.unit ? ` ${m.unit}` : ''}</Text></Text>
              </View>
              <Text style={styles.caption}>{r.isNew ? <Text style={styles.newText}>New · </Text> : null}{shortDate(r.date, true)}</Text>
            </View>
          </View>;
        })}
        {records.length > 5 && <PressableScale accessibilityRole="button" accessibilityLabel={showAllRecords ? 'Show top 5 records' : `Show all ${records.length} records`} scaleTo={0.98}
          onPress={() => setShowAllRecords(v => !v)} style={[styles.showAll, styles.hairline]}>
          <Text style={styles.showAllText}>{showAllRecords ? 'Show top 5' : `Show all ${records.length}`}</Text>
          <ChevronDown size={18} color={theme.colors.textSecondary} style={showAllRecords ? { transform: [{ rotate: '180deg' }] } : undefined} />
        </PressableScale>}
      </View>
    </View>}

    <View>
      <SectionHeader title="Training" />
      <View style={styles.card}>
        <HeatStrip rows={heat.rows} weeks={heat.weeks} />
        <Text style={styles.insight}>{heat.insight}</Text>
      </View>
    </View>

    <View>
      <SectionHeader title="Progression" />
      <View style={styles.card}>
        <PressableScale accessibilityRole="button" accessibilityLabel={`Exercise: ${selected || 'none'}. Change exercise`} scaleTo={0.98} onPress={() => setSelectorOpen(true)} style={styles.selector}>
          {!!selected && <View style={[styles.dot, { backgroundColor: categoryColor(categoryOf(selected)) }]} />}
          <Text style={styles.selectorText} numberOfLines={1}>{selected || 'Choose an exercise'}</Text>
          <ChevronDown size={20} color={theme.colors.textMuted} />
        </PressableScale>
        {options.length > 1 && <View accessibilityRole="tablist" style={styles.segment}>
          {options.map((o, i) => { const on = o.key === option.key; return <View key={o.key} style={styles.segmentCell}><PressableScale accessibilityRole="tab" accessibilityLabel={o.subtitle} accessibilityState={{ selected: on }} scaleTo={0.97}
            onPress={() => { if (!on) { Haptics.selectionAsync(); setMetricIndex(i); } }} style={[styles.segmentItem, on && styles.segmentOn]}>
            <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{o.label}</Text>
          </PressableScale></View>; })}
        </View>}
        <Text style={styles.subtitle}>{option.subtitle}{unit ? `, ${unit}` : ''}</Text>
        {points.length > 1 ? <>
          <LineChartSvg points={points} unit={unit} format={scale.format} describe={describe} height={210} />
          <View style={styles.deltaRow}>
            <Text style={[styles.delta, better && styles.deltaGood]}>{deltaText}</Text>
            {hasRecordPoint && <View style={styles.key}><View style={styles.keyDot} /><Text style={styles.caption}>Record</Text></View>}
          </View>
        </> : <View style={styles.chartEmpty}>
          {points.length === 1 && <Text style={styles.singleValue}>{metricText(option.key, points[0].value)}</Text>}
          <Text style={styles.emptyText}>{points.length === 1 ? `One session on ${shortDate(points[0].t, true)}. Log ${selected} again to draw a line.` : 'No completed sets for this metric yet.'}</Text>
        </View>}
      </View>
    </View>

    <Sheet visible={selectorOpen} onClose={() => setSelectorOpen(false)}>
      <View style={styles.sheetHeader}>
        <Text accessibilityRole="header" style={styles.sheetTitle}>Choose exercise</Text>
        <PressableScale accessibilityRole="button" accessibilityLabel="Close" onPress={() => setSelectorOpen(false)} scaleTo={0.92} style={styles.close}><X size={22} color={theme.colors.textMuted} /></PressableScale>
      </View>
      <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
        {names.map((name, i) => {
          const on = name === selected, count = sessionsOf.get(name)?.length || 0;
          return <PressableScale key={name} accessibilityRole="button" accessibilityLabel={`${name}, ${plural(count, 'session')}`} accessibilityState={{ selected: on }} scaleTo={0.98}
            onPress={() => { Haptics.selectionAsync(); setSelected(name); setSelectorOpen(false); }} style={[styles.sheetItem, i > 0 && styles.hairline]}>
            <View style={[styles.dot, { backgroundColor: categoryColor(categoryOf(name)) }]} />
            <View style={styles.recordName}>
              <Text style={[styles.liftName, !on && styles.itemOff]} numberOfLines={1}>{name}</Text>
              <Text style={styles.caption}>{plural(count, 'session')}</Text>
            </View>
            {on && <Check size={20} color={theme.colors.text} strokeWidth={2.4} />}
          </PressableScale>;
        })}
      </ScrollView>
    </Sheet>
  </View>;
};

const styles = StyleSheet.create({
  container: { gap: 24 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, paddingHorizontal: 16, paddingVertical: 12 },
  hairline: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  recordRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  recordName: { flex: 1, gap: 2 },
  liftName: { ...theme.type.label, fontSize: 15, lineHeight: 20, color: theme.colors.text },
  caption: { ...theme.type.caption, color: theme.colors.textMuted },
  recordValueCol: { alignItems: 'flex-end', gap: 2 },
  valueMark: { borderRadius: theme.radius.sm, paddingHorizontal: 0 },
  valueMarkNew: { backgroundColor: theme.colors.record, paddingHorizontal: 6 },
  recordValue: { fontFamily: theme.type.metric.fontFamily, fontSize: 26, lineHeight: 30, fontVariant: ['tabular-nums'], color: theme.colors.text },
  recordUnit: { fontFamily: theme.type.label.fontFamily, fontSize: 13, color: theme.colors.textMuted },
  onRecord: { color: theme.colors.onRecord },
  newText: { fontFamily: theme.type.label.fontFamily, color: theme.colors.text },
  showAll: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  showAllText: { ...theme.type.label, color: theme.colors.textSecondary },
  insight: { ...theme.type.body, color: theme.colors.textSecondary, marginTop: 12 },
  selector: { minHeight: 48, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceElevated, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  selectorText: { ...theme.type.label, fontSize: 16, lineHeight: 20, color: theme.colors.text, flex: 1 },
  segment: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: theme.radius.md, backgroundColor: theme.colors.canvas, marginTop: 8 },
  segmentCell: { flex: 1 },
  segmentItem: { minHeight: 44, borderRadius: theme.radius.sm, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: theme.colors.primary },
  segmentText: { ...theme.type.label, color: theme.colors.textMuted },
  segmentTextOn: { color: theme.colors.onPrimary },
  subtitle: { ...theme.type.caption, color: theme.colors.textMuted, marginTop: 14, marginBottom: 2 },
  deltaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 4 },
  delta: { fontFamily: theme.type.label.fontFamily, fontSize: 15, lineHeight: 20, fontVariant: ['tabular-nums'], color: theme.colors.textMuted },
  deltaGood: { color: theme.colors.text }, // improvement is chalk with its sign; worse or flat stays muted
  key: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  keyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.record },
  chartEmpty: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12 },
  singleValue: { ...theme.type.metric, fontVariant: ['tabular-nums'], color: theme.colors.text },
  emptyText: { ...theme.type.body, color: theme.colors.textMuted, textAlign: 'center' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { ...theme.type.title, color: theme.colors.text },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  sheetList: { maxHeight: 460 },
  sheetItem: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  itemOff: { color: theme.colors.textSecondary },
});
