import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { Header } from '../../components/layout/Header';
import { PressableScale, SectionHeader } from '../../components/ui/Primitives';
import { WeeklySchedule } from './WeeklySchedule';
import { TodayFocusCard } from './TodayFocusCard';
import { ResumeCard } from './ResumeCard';
import { CategoryStrip, lastDone, relativeDay } from './CategoryStrip';
import { WorkoutLog, WorkoutTemplate, ViewState } from '../../types';
import { ActiveSession } from '../../utils/activeSession';
import { currentStreak, sessionsThisWeek } from '../../utils/training';
import { theme } from '../../constants/theme';

interface DashboardPageProps {
  templates: WorkoutTemplate[]; logs: WorkoutLog[];
  startWorkout: (t: WorkoutTemplate) => void; setView: (v: ViewState) => void;
  activeSession?: ActiveSession | null; onResume?: (s: ActiveSession) => void; onDiscardSession?: () => void;
}

const Score = ({ value, label }: { value: number; label: string }) =>
  <Text style={styles.scoreLabel}><Text style={styles.scoreValue}>{value}</Text>{label}</Text>;

export const DashboardPage = ({ templates, logs, startWorkout, setView, activeSession, onResume, onDiscardSession }: DashboardPageProps) => {
  const todayIndex = new Date().getDay();
  const todaysWorkouts = useMemo(() => templates.filter(t => t.scheduleDays?.includes(todayIndex)), [templates, todayIndex]);
  const week = useMemo(() => sessionsThisWeek(logs), [logs]);
  const streak = useMemo(() => currentStreak(logs), [logs]);

  return <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
    <Header title="Today" subtitle={format(new Date(), 'EEEE d MMMM')} />
    <View style={styles.content}>
      {activeSession && onResume && <ResumeCard session={activeSession} onResume={onResume} onDiscard={() => onDiscardSession?.()} />}
      <TodayFocusCard todaysWorkouts={todaysWorkouts} templates={templates} logs={logs} onStartWorkout={startWorkout}
        onBrowse={() => setView('templates')} onCreate={() => setView('templates')} secondaryStart={!!activeSession} />

      {(logs.length > 0 || templates.some(t => t.scheduleDays?.length)) && <View style={styles.week}>
        <WeeklySchedule templates={templates} logs={logs} onStartWorkout={startWorkout} />
        {logs.length > 0 && <View style={styles.scoreboard} accessible accessibilityLabel={`${week} sessions this week, ${logs.length} total${streak ? `, ${streak}-day streak` : ''}`}>
          <Score value={week} label=" this week" />
          <Text style={styles.scoreSep}>·</Text>
          <Score value={logs.length} label=" total" />
          {streak > 0 && <><Text style={styles.scoreSep}>·</Text><Score value={streak} label="-day streak" /></>}
        </View>}
      </View>}

      {templates.length > 0 && <View>
        <SectionHeader title="Your routines" action="See all" onAction={() => setView('templates')} />
        <View style={styles.list}>{templates.slice(0, 3).map((t, i) => {
          const last = lastDone(t, logs);
          const meta = `${t.exercises.length} ${t.exercises.length === 1 ? 'exercise' : 'exercises'} · ${last ? `last done ${relativeDay(last)}` : 'not done yet'}`;
          return <PressableScale key={t.id} accessibilityRole="button" accessibilityLabel={`Start ${t.name}, ${meta}`} onPress={() => startWorkout(t)} scaleTo={0.98}
            style={[styles.routine, i > 0 && styles.routineDivider]}>
            <View style={styles.routineTop}>
              <Text style={styles.routineName} numberOfLines={1}>{t.name}</Text>
              <Text style={styles.routineStart}>Start</Text>
            </View>
            <Text style={styles.routineMeta} numberOfLines={1}>{meta}</Text>
            <View style={styles.routineStrip}><CategoryStrip exercises={t.exercises} height={4} /></View>
          </PressableScale>;
        })}</View>
      </View>}
    </View>
  </ScrollView>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.canvas }, scroll: { paddingBottom: 110 },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 28, maxWidth: 620, width: '100%', alignSelf: 'center' },
  week: { gap: 14 },
  scoreboard: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 10, rowGap: 2 },
  scoreValue: { ...theme.type.metric, fontVariant: ['tabular-nums'], color: theme.colors.text },
  scoreLabel: { ...theme.type.label, color: theme.colors.textMuted },
  scoreSep: { ...theme.type.label, color: theme.colors.textSubtle },
  list: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, overflow: 'hidden' },
  routine: { minHeight: 72, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center' },
  routineDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  routineTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  routineName: { ...theme.type.heading, color: theme.colors.text, flex: 1 },
  routineStart: { ...theme.type.label, color: theme.colors.textSecondary },
  routineMeta: { ...theme.type.caption, fontSize: 13, color: theme.colors.textMuted, marginTop: 2 },
  routineStrip: { marginTop: 10, width: '60%' },
});
