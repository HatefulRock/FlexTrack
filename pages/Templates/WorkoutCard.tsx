import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MoreHorizontal, Pencil, Play } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { WorkoutTemplate } from '../../types';
import { getShortDayName } from '../../utils/formatters';
import { theme } from '../../constants/theme';
import { PressableScale } from '../../components/ui/Primitives';
import { showAlert } from '../../components/ui/Dialog';
import { CategoryStrip, routineSummary } from '../Dashboard/CategoryStrip';

interface Props { template: WorkoutTemplate; onEdit: (t: WorkoutTemplate) => void; onDelete: (id: string) => void; onStart: (t: WorkoutTemplate) => void; }

// Placeholder copy older builds wrote into new routines; not a real description.
const FILLER = /^a focused workout routine\.?$/i;
const ORDER = [0, 1, 2, 3, 4, 5, 6];

export const WorkoutCard = ({ template, onEdit, onDelete, onStart }: Props) => {
  const start = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onStart(template); };
  const description = template.description?.trim();
  const days = ORDER.filter(d => template.scheduleDays?.includes(d));
  const more = () => showAlert(template.name, undefined, [
    { text: 'Edit routine', onPress: () => onEdit(template) },
    { text: 'Delete routine', style: 'destructive', onPress: () => onDelete(template.id) },
    { text: 'Cancel', style: 'cancel' },
  ]);
  return <View style={styles.card}>
    <View style={styles.top}>
      <View style={styles.grow}><PressableScale accessibilityRole="button" accessibilityLabel={`Edit routine ${template.name}`} onPress={() => onEdit(template)} scaleTo={0.98} style={styles.main}>
        <Text accessibilityRole="header" style={styles.title} numberOfLines={2}>{template.name}</Text>
        {!!description && !FILLER.test(description) && <Text numberOfLines={2} style={styles.description}>{description}</Text>}
      </PressableScale></View>
      <PressableScale accessibilityRole="button" accessibilityLabel={`More actions for ${template.name}`} onPress={more} scaleTo={0.92} style={styles.more}>
        <MoreHorizontal size={22} color={theme.colors.textMuted} />
      </PressableScale>
    </View>
    <View style={styles.meta}>
      {days.length ? <View style={styles.days} accessibilityLabel={`Scheduled ${days.map(getShortDayName).join(', ')}`}>
        {days.map(d => <View key={d} style={styles.day}><Text style={styles.dayText}>{getShortDayName(d)}</Text></View>)}
      </View> : <Text style={styles.metaText}>Not scheduled</Text>}
      <Text style={styles.metaText}>{routineSummary(template)}</Text>
    </View>
    {template.exercises.length > 0 && <View style={styles.strip}><CategoryStrip exercises={template.exercises} height={6} /></View>}
    <View style={styles.actions}>
      <View style={styles.grow}><PressableScale accessibilityRole="button" accessibilityLabel={`Start ${template.name}`} onPress={start} style={styles.start}>
        <Play size={18} color={theme.colors.onPrimary} fill={theme.colors.onPrimary} />
        <Text style={styles.startText}>Start</Text>
      </PressableScale></View>
      <PressableScale accessibilityRole="button" accessibilityLabel={`Edit routine ${template.name}`} onPress={() => onEdit(template)} scaleTo={0.92} style={styles.edit}>
        <Pencil size={19} color={theme.colors.text} />
      </PressableScale>
    </View>
  </View>;
};

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, paddingTop: 12, paddingRight: 8 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  grow: { flex: 1, minWidth: 0 },
  main: { paddingTop: 4 },
  title: { ...theme.type.title, color: theme.colors.text },
  description: { ...theme.type.body, color: theme.colors.textMuted, marginTop: 2 },
  more: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.md },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 6, marginTop: 12, paddingRight: 8 },
  days: { flexDirection: 'row', gap: 4 },
  day: { minHeight: 24, paddingHorizontal: 7, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceElevated, justifyContent: 'center' },
  dayText: { ...theme.type.caption, color: theme.colors.textSecondary },
  metaText: { ...theme.type.caption, fontSize: 13, color: theme.colors.textMuted, fontVariant: ['tabular-nums'] },
  strip: { marginTop: 14, paddingRight: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingRight: 8 },
  start: { minHeight: 48, borderRadius: theme.radius.md, backgroundColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  startText: { ...theme.type.button, color: theme.colors.onPrimary },
  edit: { width: 48, height: 48, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
});
