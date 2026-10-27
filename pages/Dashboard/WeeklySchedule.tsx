import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { WorkoutLog, WorkoutTemplate } from '../../types';
import { theme } from '../../constants/theme';
import { SectionHeader } from '../../components/ui/Primitives';
import { formatNumber, logVolume } from '../../utils/training';
import { sessionCategories } from '../History/historyModel';

const BAR_MAX = 64, BAR_MIN = 6, STUB = 14;
const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Day = { date: Date; dow: number; volume: number; cardio: number; trained: boolean; scheduled?: WorkoutTemplate; isToday: boolean; future: boolean };

const isCardio = (l: WorkoutLog) => sessionCategories(l).every(s => s.category === 'cardio');
const minutesOf = (l: WorkoutLog) => (l.endTime ? Math.max(0, l.endTime - l.startTime) / 60000 : 0);

// Sunday-to-Saturday, matching sessionsThisWeek. Two measures, never mixed: lifting days get a chalk bar whose height is volume,
// cardio gets a chrome bar whose height is minutes (beside the lifting bar on a day with both).
export const WeeklySchedule = ({ templates, logs = [], onStartWorkout }: { templates: WorkoutTemplate[]; logs?: WorkoutLog[]; onStartWorkout: (t: WorkoutTemplate) => void }) => {
  const days = useMemo<Day[]>(() => {
    const now = new Date(), from = startOfWeek(now);
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(from, i), dayLogs = logs.filter(l => isSameDay(new Date(l.startTime), date));
      const volume = dayLogs.reduce((s, l) => s + logVolume(l), 0);
      const cardio = dayLogs.filter(isCardio).reduce((s, l) => s + minutesOf(l), 0);
      const isToday = isSameDay(date, now);
      return { date, dow: i, volume, cardio, trained: dayLogs.length > 0, scheduled: templates.find(t => t.scheduleDays?.includes(i)), isToday, future: !isToday && date > now };
    });
  }, [templates, logs]);
  const maxVolume = Math.max(1, ...days.map(d => d.volume));
  const maxMinutes = Math.max(60, ...days.map(d => d.cardio));

  return <View>
    <SectionHeader title="This week" />
    <View style={styles.chart}>
      <View style={styles.baseline} />
      {days.map(d => {
        const pending = !d.trained && !!d.scheduled && (d.future || d.isToday);
        const cardioOnly = d.trained && !d.volume && d.cardio > 0, lifted = d.trained && !cardioOnly;
        const liftH = lifted ? Math.max(BAR_MIN, Math.round(BAR_MAX * d.volume / maxVolume)) : 0;
        const cardioH = d.cardio > 0 ? Math.max(BAR_MIN, Math.round(BAR_MAX * Math.min(1, d.cardio / maxMinutes))) : 0;
        const value = d.volume ? `${(d.volume / 1000).toFixed(1)}t` : cardioOnly ? `${Math.round(d.cardio)}m` : '';
        const parts = [d.volume ? `${formatNumber(d.volume)} kg lifted` : lifted ? 'lifted' : '', d.cardio > 0 ? `${Math.round(d.cardio)} minutes cardio` : ''].filter(Boolean);
        const label = `${format(d.date, 'EEEE d')}${d.isToday ? ', today' : ''}: ${d.trained ? `trained, ${parts.join(', ')}` : pending ? `${d.scheduled!.name} scheduled` : 'rest'}`;
        const column = <>
          <View style={styles.barArea}>
            {!!value && <Text style={styles.value} numberOfLines={1}>{value}</Text>}
            {cardioOnly ? <View style={[styles.bar, styles.cardioBar, { height: cardioH }]} />
              : lifted ? <View style={styles.pair}>
                <View style={[styles.liftBar, { height: liftH }]} />
                {cardioH > 0 && <View style={[styles.sideBar, { height: cardioH }]} />}
              </View>
              : pending ? <View style={styles.stub} /> : null}
          </View>
          <Text style={[styles.letter, d.isToday && styles.todayText]}>{LETTERS[d.dow]}</Text>
          <Text style={[styles.date, d.isToday && styles.todayText]}>{d.date.getDate()}</Text>
          <View style={[styles.underline, d.isToday && styles.underlineOn]} />
        </>;
        return pending
          ? <Pressable key={d.dow} accessibilityRole="button" accessibilityLabel={`${label}. Start ${d.scheduled!.name}`} onPress={() => onStartWorkout(d.scheduled!)} style={({ pressed }) => [styles.col, pressed && styles.pressed]}>{column}</Pressable>
          : <View key={d.dow} accessible accessibilityLabel={label} style={styles.col}>{column}</View>;
      })}
    </View>
    <View style={styles.key}>
      <View style={styles.keyItem}><View style={styles.keyBar} /><Text style={styles.keyText}>Lifting · height is volume</Text></View>
      <View style={styles.keyItem}><View style={[styles.keyBar, styles.cardioBar]} /><Text style={styles.keyText}>Cardio · minutes</Text></View>
      <View style={styles.keyItem}><View style={styles.keyStub} /><Text style={styles.keyText}>Scheduled</Text></View>
    </View>
  </View>;
};

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, paddingHorizontal: 6, paddingTop: 12, paddingBottom: 6 },
  baseline: { position: 'absolute', left: 12, right: 12, top: 12 + 16 + BAR_MAX, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.borderStrong },
  col: { flex: 1, minWidth: 0, alignItems: 'center' }, pressed: { opacity: 0.7 },
  barArea: { height: 16 + BAR_MAX, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  value: { ...theme.type.caption, fontFamily: theme.type.numeric.fontFamily, fontVariant: ['tabular-nums'], fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 },
  bar: { width: '56%', maxWidth: 28, backgroundColor: theme.colors.done, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  cardioBar: { backgroundColor: theme.category.cardio },
  pair: { width: '56%', maxWidth: 28, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  liftBar: { flex: 1, backgroundColor: theme.colors.done, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  sideBar: { width: 4, backgroundColor: theme.category.cardio, borderTopLeftRadius: 1, borderTopRightRadius: 1 },
  stub: { width: '56%', maxWidth: 28, height: STUB, borderWidth: 1.5, borderBottomWidth: 0, borderColor: theme.colors.textMuted, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  letter: { ...theme.type.caption, color: theme.colors.textMuted, marginTop: 8 },
  date: { fontFamily: theme.type.display.fontFamily, fontSize: 22, lineHeight: 26, color: theme.colors.textSecondary, fontVariant: ['tabular-nums'] },
  todayText: { color: theme.colors.text },
  underline: { width: 18, height: 3, borderRadius: 1, marginTop: 3, marginBottom: 4 },
  underlineOn: { backgroundColor: theme.colors.primary },
  key: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 4, marginTop: 10, paddingHorizontal: 2 },
  keyItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  keyBar: { width: 8, height: 10, backgroundColor: theme.colors.done, borderRadius: 1 },
  keyStub: { width: 8, height: 10, borderWidth: 1.5, borderBottomWidth: 0, borderColor: theme.colors.textMuted, borderRadius: 1 },
  keyText: { ...theme.type.caption, color: theme.colors.textMuted },
});
