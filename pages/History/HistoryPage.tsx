import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, History as HistoryIcon } from 'lucide-react-native';
import { format, isSameDay } from 'date-fns';
import { Header } from '../../components/layout/Header';
import { Chip, EmptyState, PressableScale, SectionHeader } from '../../components/ui/Primitives';
import { WorkoutLog } from '../../types';
import { theme } from '../../constants/theme';
import { currentStreak, formatDuration } from '../../utils/training';
import { LogItem } from './LogItem';
import { TrainingCalendar } from './TrainingCalendar';
import { sessionMs } from './historyModel';

export const HistoryPage = ({ logs }: { logs: WorkoutLog[] }) => {
  const [filter, setFilter] = useState('All'), [selected, setSelected] = useState<Date | null>(null);
  const options = useMemo(() => ['All', ...Array.from(new Set(logs.map(l => l.templateName)))], [logs]);
  const stats = useMemo(() => ({
    avg: logs.length ? logs.reduce((n, l) => n + sessionMs(l), 0) / logs.length : 0,
    streak: currentStreak(logs),
  }), [logs]);
  const shown = useMemo(() => logs.filter(l => (filter === 'All' || l.templateName === filter) && (!selected || isSameDay(new Date(l.startTime), selected)))
    .sort((a, b) => b.startTime - a.startTime), [logs, filter, selected]);
  const grouped = useMemo(() => {
    const year = new Date().getFullYear();
    return shown.reduce<Record<string, WorkoutLog[]>>((all, l) => {
      const d = new Date(l.startTime), key = format(d, d.getFullYear() === year ? 'MMMM' : 'MMMM yyyy');
      (all[key] ??= []).push(l); return all;
    }, {});
  }, [shown]);
  const clear = () => { setFilter('All'); setSelected(null); };

  return <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
    <Header title="History" />
    <View style={styles.content}>
      {logs.length > 0 && <Text style={styles.score} accessibilityLabel={`${logs.length} sessions, ${formatDuration(stats.avg)} average, ${stats.streak} day streak`}>
        <Text style={styles.scoreNum}>{logs.length}</Text><Text style={styles.scoreLabel}> {logs.length === 1 ? 'session' : 'sessions'}</Text>
        <Text style={styles.scoreDot}>{'  ·  '}</Text>
        <Text style={styles.scoreNum}>{formatDuration(stats.avg)}</Text><Text style={styles.scoreLabel}> average</Text>
        <Text style={styles.scoreDot}>{'  ·  '}</Text>
        <Text style={styles.scoreNum}>{stats.streak}</Text><Text style={styles.scoreLabel}>-day streak</Text>
      </Text>}
      <TrainingCalendar logs={logs} selected={selected} onSelect={d => setSelected(selected && isSameDay(selected, d) ? null : d)} />
      {logs.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filters}>
        {options.map(o => <Chip key={o} label={o} active={filter === o} onPress={() => setFilter(o)} accessibilityLabel={o === 'All' ? 'Show all sessions' : `Show ${o} sessions`} />)}
      </ScrollView>}
      {selected && <View style={styles.selection}>
        <Text style={styles.selectionText}>Showing {format(selected, 'EEEE, MMMM d')}</Text>
        <PressableScale accessibilityRole="button" accessibilityLabel="Clear selected day" scaleTo={0.95} onPress={() => setSelected(null)} style={styles.clear}>
          <Text style={styles.clearText}>Clear</Text>
        </PressableScale>
      </View>}
      {!logs.length ? <EmptyState icon={HistoryIcon} title="No sessions yet" message="Finish a routine or quick-log a run and it lands here, filling the calendar by training split: every set, weight and minute you put in." /> :
        !shown.length ? <EmptyState icon={CalendarDays} title={selected ? 'Rest day' : 'No sessions match'} message={selected && filter === 'All' ? `Nothing logged on ${format(selected, 'EEEE, MMMM d')}. Tap a filled day to see its session.` : `No ${filter} session${selected ? ` on ${format(selected, 'MMMM d')}` : ''}.`} action="Clear filters" onAction={clear} /> :
          Object.entries(grouped).map(([month, items]) => <View key={month}>
            <SectionHeader title={month} />
            <View style={styles.list}>{items.map((l, i) => <LogItem key={l.id} log={l} first={i === 0} />)}</View>
          </View>)}
    </View>
  </ScrollView>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.canvas },
  scroll: { paddingBottom: 110 },
  content: { paddingHorizontal: 16, gap: 16, maxWidth: 620, width: '100%', alignSelf: 'center' },
  score: { lineHeight: 36, color: theme.colors.text },
  scoreNum: { ...theme.type.metric, fontVariant: ['tabular-nums'], fontSize: 32, color: theme.colors.text },
  scoreLabel: { ...theme.type.label, color: theme.colors.textMuted },
  scoreDot: { ...theme.type.label, color: theme.colors.textSubtle },
  filterScroll: { marginHorizontal: -16, flexGrow: 0 },
  filters: { gap: 8, paddingHorizontal: 16 },
  selection: { minHeight: 48, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surface, paddingLeft: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectionText: { ...theme.type.label, color: theme.colors.text, flex: 1 },
  clear: { minHeight: 48, minWidth: 64, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  clearText: { ...theme.type.label, color: theme.colors.text, textDecorationLine: 'underline' },
  list: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, overflow: 'hidden' },
});
