import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WorkoutTemplate } from '../../types';
import { getShortDayName } from '../../utils/formatters';
import { theme } from '../../constants/theme';
import { SectionHeader } from '../../components/ui/Primitives';

export const WeeklySchedule = ({ templates, onStartWorkout }: { templates: WorkoutTemplate[]; onStartWorkout: (t: WorkoutTemplate) => void }) => {
  const today = new Date().getDay();
  return <View><SectionHeader title="This week" /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
    {[0,1,2,3,4,5,6].map(day => {
      const workouts = templates.filter(t => t.scheduleDays?.includes(day)), active = day === today;
      return <TouchableOpacity key={day} accessibilityLabel={`${getShortDayName(day)}${workouts.length ? `, ${workouts[0].name}` : ', rest day'}`} onPress={() => workouts[0] && onStartWorkout(workouts[0])}
        disabled={!workouts.length} style={[styles.day, active && styles.today]}>
        <Text style={[styles.dayName, active && styles.todayName]}>{getShortDayName(day).slice(0,2)}</Text><Text style={[styles.dayNumber, active && styles.todayNumber]}>{new Date(Date.now() + (day - today) * 86400000).getDate()}</Text>
        <View style={[styles.dot, workouts.length && styles.dotPlanned, active && workouts.length && styles.dotToday]} />
      </TouchableOpacity>;
    })}
  </ScrollView></View>;
};
const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 16 }, day: { width: 52, height: 78, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  today: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary }, dayName: { ...theme.type.caption, color: theme.colors.textMuted, textTransform: 'uppercase' }, todayName: { color: theme.colors.primary },
  dayNumber: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginVertical: 4, fontVariant: ['tabular-nums'] }, todayNumber: { color: theme.colors.primary }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.colors.borderStrong }, dotPlanned: { backgroundColor: theme.colors.energy }, dotToday: { backgroundColor: theme.colors.primary },
});

