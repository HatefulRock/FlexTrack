import React, { useMemo, useState } from 'react';
import { ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, Download, HeartPulse, History as HistoryIcon } from 'lucide-react-native';
import { format, isSameDay } from 'date-fns';
import { Header } from '../../components/layout/Header';
import { Chip, EmptyState, PressableScale, SectionHeader } from '../../components/ui/Primitives';
import { WorkoutLog } from '../../types';
import { theme } from '../../constants/theme';
import { currentStreak, formatDuration } from '../../utils/training';
import { LogItem } from './LogItem';
import { TrainingCalendar } from './TrainingCalendar';
import { sessionMs } from './historyModel';

export interface HealthSyncAction { name: string; enabled: boolean; onPress: () => void }

export const HistoryPage = ({ logs, onExport, health }: { logs: WorkoutLog[]; onExport: () => void; health?: HealthSyncAction }) => {
  const [filter, setFilter] = useState('All'), [selected, setSelected] = useState<Date | null>(null);
  const options = useMemo(() => ['All', ...Array.from(new Set(logs.map(l => l.templateName)))], [logs]);
  // Sessions logged without a duration don't pull the average towards zero.
  const stats = useMemo(() => {
    const timed = logs.map(sessionMs).filter(ms => ms > 0);
    return { avg: timed.length ? timed.reduce((n, ms) => n + ms, 0) / timed.length : 0, streak: currentStreak(logs) };
  }, [logs]);
  const shown = useMemo(() => logs.filter(l => (filter === 'All' || l.templateName === filter) && (!selected || isSameDay(new Date(l.startTime), selected)))
    .sort((a, b) => b.startTime - a.startTime), [logs, filter, selected]);
  const sections = useMemo(() => {
    const year = new Date().getFullYear();
    const byMonth = shown.reduce<Record<string, WorkoutLog[]>>((all, l) => {
      const d = new Date(l.startTime), key = format(d, d.getFullYear() === year ? 'MMMM' : 'MMMM yyyy');
      (all[key] ??= []).push(l); return all;
    }, {});
    return Object.entries(byMonth).map(([title, data]) => ({ title, data }));
  }, [shown]);
  const clear = () => { setFilter('All'); setSelected(null); };

  const top = <>
    <Header title="History" rightAction={<>
      {health && <PressableScale accessibilityRole="button" accessibilityLabel={`${health.name} sync, ${health.enabled ? 'on' : 'off'}`} onPress={health.onPress} scaleTo={0.92} style={[styles.health, health.enabled && styles.healthOn]}>
        <HeartPulse size={20} color={health.enabled ? theme.colors.onPrimary : theme.colors.text} />
      </PressableScale>}
      <PressableScale accessibilityRole="button" accessibilityLabel="Export all data" onPress={onExport} scaleTo={0.92} style={styles.export}>
        <Download size={20} color={theme.colors.text} />
        <Text style={styles.exportText}>Export</Text>
      </PressableScale>
    </>} />
    <View style={[styles.content, styles.top]}>
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
    </View>
  </>;

  // Virtualized: only the sessions on screen are mounted, however long the history grows.
  return <SectionList style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
    sections={sections} keyExtractor={l => l.id} stickySectionHeadersEnabled={false} initialNumToRender={12} windowSize={7}
    ListHeaderComponent={top}
    ListEmptyComponent={<View style={styles.content}>
      {!logs.length ? <EmptyState icon={HistoryIcon} title="No sessions yet" message="Finish a routine or quick-log a run and it lands here, filling the calendar by training split: every set, weight and minute you put in." /> :
        <EmptyState icon={CalendarDays} title={selected && filter === 'All' ? 'Rest day' : 'No sessions match'} message={selected && filter === 'All' ? `Nothing logged on ${format(selected, 'EEEE, MMMM d')}. Tap a filled day to see its session.` : `No ${filter} session${selected ? ` on ${format(selected, 'MMMM d')}` : ''}.`} action="Clear filters" onAction={clear} />}
    </View>}
    renderSectionHeader={({ section }) => <View style={styles.content}><SectionHeader title={section.title} /></View>}
    renderSectionFooter={() => <View style={styles.sectionGap} />}
    renderItem={({ item, index, section }) => <View style={styles.content}>
      <View style={[styles.row, index === 0 && styles.rowFirst, index === section.data.length - 1 && styles.rowLast]}>
        <LogItem log={item} first={index === 0} />
      </View>
    </View>}
  />;
};

const styles = StyleSheet.create({
  export: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface },
  health: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.md, backgroundColor: theme.colors.surface },
  healthOn: { backgroundColor: theme.colors.primary },
  exportText: { ...theme.type.label, color: theme.colors.text },
  container: { flex: 1, backgroundColor: theme.colors.canvas },
  scroll: { paddingBottom: 110 },
  content: { paddingHorizontal: 16, maxWidth: 620, width: '100%', alignSelf: 'center' },
  top: { gap: 16, marginBottom: 16 },
  sectionGap: { height: 16 },
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
  row: { backgroundColor: theme.colors.surface, overflow: 'hidden' },
  rowFirst: { borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg },
  rowLast: { borderBottomLeftRadius: theme.radius.lg, borderBottomRightRadius: theme.radius.lg },
});
