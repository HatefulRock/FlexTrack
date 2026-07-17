import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, Dumbbell, Flame, Trophy } from 'lucide-react-native';
import { Header } from '../../components/layout/Header';
import { Card, SectionHeader } from '../../components/ui/Primitives';
import { WeeklySchedule } from './WeeklySchedule';
import { TodayFocusCard } from './TodayFocusCard';
import { WorkoutLog, WorkoutTemplate, ViewState } from '../../types';
import { theme } from '../../constants/theme';

interface DashboardPageProps {
  templates: WorkoutTemplate[]; logs: WorkoutLog[];
  startWorkout: (t: WorkoutTemplate) => void; setView: (v: ViewState) => void;
}

export const DashboardPage = ({ templates, logs, startWorkout, setView }: DashboardPageProps) => {
  const todayIndex = new Date().getDay();
  const todaysWorkouts = useMemo(() => templates.filter(t => t.scheduleDays?.includes(todayIndex)), [templates, todayIndex]);
  const weekWorkouts = useMemo(() => {
    const now = Date.now(), week = 7 * 86400000;
    return logs.filter(l => (l.endTime || l.startTime) >= now - week).length;
  }, [logs]);
  const latest = logs.length ? [...logs].sort((a,b) => (b.endTime || b.startTime) - (a.endTime || a.startTime))[0] : null;

  return <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
    <Header title="Today" />
    <View style={styles.content}>
      <TodayFocusCard todaysWorkouts={todaysWorkouts} onStartWorkout={startWorkout} onBrowse={() => setView('templates')} />
      <View style={styles.momentum}>
        <Card style={styles.metricCard}><View style={styles.metricIcon}><Flame size={18} color={theme.colors.energy} /></View><Text style={styles.metricValue}>{weekWorkouts}</Text><Text style={styles.metricLabel}>sessions this week</Text></Card>
        <Card style={styles.metricCard}><View style={[styles.metricIcon, styles.metricIconBlue]}><Trophy size={18} color={theme.colors.primary} /></View><Text style={styles.metricValue}>{logs.length}</Text><Text style={styles.metricLabel}>total workouts</Text></Card>
      </View>
      <WeeklySchedule templates={templates} onStartWorkout={startWorkout} />
      <View><SectionHeader title="Your routines" action="See all" onAction={() => setView('templates')} />
        {templates.length ? <View style={styles.list}>{templates.slice(0,3).map(t => <TouchableOpacity key={t.id} onPress={() => startWorkout(t)} style={styles.routine}>
          <View style={styles.routineIcon}><Dumbbell size={19} color={theme.colors.primary} /></View><View style={styles.routineCopy}><Text style={styles.routineName}>{t.name}</Text><Text style={styles.routineMeta}>{t.exercises.length} exercises{latest?.templateId === t.id ? ' · Last trained' : ''}</Text></View><ChevronRight size={20} color={theme.colors.textSubtle} />
        </TouchableOpacity>)}</View> : <Card><Text style={styles.emptyTitle}>Build your first routine</Text><Text style={styles.emptyBody}>Create a repeatable plan and it will appear here for one-tap starts.</Text></Card>}
      </View>
    </View>
  </ScrollView>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.canvas }, scroll: { paddingBottom: 110 }, content: { paddingHorizontal: 16, gap: 24, maxWidth: 620, width: '100%', alignSelf: 'center' },
  momentum: { flexDirection: 'row', gap: 12 }, metricCard: { flex: 1, padding: 14 }, metricIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: theme.colors.energySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, metricIconBlue: { backgroundColor: theme.colors.primarySoft },
  metricValue: { ...theme.type.metric, color: theme.colors.text }, metricLabel: { ...theme.type.caption, color: theme.colors.textMuted, marginTop: 2 },
  list: { borderRadius: theme.radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border }, routine: { minHeight: 70, paddingHorizontal: 14, backgroundColor: theme.colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  routineIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, routineCopy: { flex: 1 }, routineName: { ...theme.type.label, color: theme.colors.text }, routineMeta: { ...theme.type.caption, color: theme.colors.textMuted, marginTop: 3 },
  emptyTitle: { ...theme.type.heading, color: theme.colors.text }, emptyBody: { ...theme.type.body, color: theme.colors.textMuted, marginTop: 6 },
});

