import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { format, isSameDay } from 'date-fns';
import { WorkoutLog, WorkoutTemplate } from '../../types';
import { theme } from '../../constants/theme';
import { Button, PressableScale } from '../../components/ui/Primitives';
import { CategoryLegend, CategoryStrip, routineSummary } from './CategoryStrip';
import { FilledPlay } from './FilledPlay';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// The next scheduled routine after today, within the coming week.
const nextScheduled = (templates: WorkoutTemplate[], today: number) => {
  for (let offset = 1; offset <= 7; offset++) {
    const day = (today + offset) % 7, t = templates.find(x => x.scheduleDays?.includes(day));
    if (t) return { template: t, when: offset === 1 ? 'tomorrow' : offset === 7 ? `next ${DAY_NAMES[day]}` : `on ${DAY_NAMES[day]}` };
  }
  return null;
};

interface Props {
  todaysWorkouts: WorkoutTemplate[]; templates?: WorkoutTemplate[]; logs?: WorkoutLog[];
  onStartWorkout: (t: WorkoutTemplate) => void; onBrowse: () => void; onCreate?: () => void; secondaryStart?: boolean;
}

export const TodayFocusCard = ({ todaysWorkouts, templates = todaysWorkouts, logs = [], onStartWorkout, onBrowse, onCreate, secondaryStart }: Props) => {
  const now = new Date();
  const isNew = logs.length === 0;
  const workout = todaysWorkouts[0] ?? (isNew ? templates[0] : undefined);

  if (workout) {
    const doneToday = logs.filter(l => l.templateId === workout.id && isSameDay(new Date(l.startTime), now)).sort((a, b) => b.startTime - a.startTime)[0];
    const others = todaysWorkouts.filter(t => t.id !== workout.id);
    return <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.title} numberOfLines={2}>{workout.name}</Text>
      <Text style={styles.meta}>{isNew ? 'Your first session · ' : ''}{routineSummary(workout)}{doneToday ? ` · done at ${format(doneToday.startTime, 'HH:mm')}` : ''}</Text>
      {workout.exercises.length > 0 && <View style={styles.shape}>
        <CategoryStrip exercises={workout.exercises} height={12} />
        <CategoryLegend exercises={workout.exercises} />
      </View>}
      <Button label={doneToday ? 'Start again' : 'Start session'} icon={FilledPlay} variant={doneToday || secondaryStart ? 'secondary' : 'primary'}
        accessibilityLabel={`Start ${workout.name}`} onPress={() => onStartWorkout(workout)} style={styles.start} />
      {others.map(t => <PressableScale key={t.id} accessibilityRole="button" accessibilityLabel={`Start ${t.name}`} onPress={() => onStartWorkout(t)} scaleTo={0.98} style={styles.also}>
        <Text style={styles.alsoText} numberOfLines={1}>Also today: <Text style={styles.alsoName}>{t.name}</Text></Text>
        <Text style={styles.alsoAction}>Start</Text>
      </PressableScale>)}
    </View>;
  }

  if (!templates.length) return <View style={styles.panel}>
    <Text accessibilityRole="header" style={styles.title}>Build your first routine</Text>
    <Text style={styles.body}>Pick the exercises once. Schedule the days and today&apos;s session shows up here, ready to start.</Text>
    <Button label="New routine" onPress={onCreate ?? onBrowse} style={styles.start} />
  </View>;

  const next = nextScheduled(templates, now.getDay());
  return <View style={styles.panel}>
    <Text accessibilityRole="header" style={styles.title}>Rest day</Text>
    <Text style={styles.body}>{next ? <>Next: <Text style={styles.strong}>{next.template.name}</Text> {next.when}</> : 'No routine is scheduled this week.'}</Text>
    {next && next.template.exercises.length > 0 && <View style={styles.shapeQuiet}><CategoryStrip exercises={next.template.exercises} height={6} /></View>}
    <Button label="Train anyway" variant="secondary" onPress={onBrowse} style={styles.restButton} />
  </View>;
};

const styles = StyleSheet.create({
  panel: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, paddingTop: 18 },
  title: { ...theme.type.display, color: theme.colors.text },
  meta: { ...theme.type.label, color: theme.colors.textSecondary, marginTop: 6, fontVariant: ['tabular-nums'] },
  body: { ...theme.type.body, color: theme.colors.textMuted, marginTop: 6 },
  strong: { fontFamily: theme.type.label.fontFamily, color: theme.colors.text },
  shape: { marginTop: 18, gap: 10 },
  shapeQuiet: { marginTop: 14, opacity: 0.7 },
  start: { marginTop: 18, minHeight: 56 },
  restButton: { marginTop: 18, minHeight: 48 },
  also: { minHeight: 44, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  alsoText: { ...theme.type.body, color: theme.colors.textMuted, flex: 1 },
  alsoName: { fontFamily: theme.type.label.fontFamily, color: theme.colors.text },
  alsoAction: { ...theme.type.label, color: theme.colors.text, textDecorationLine: 'underline' },
});
