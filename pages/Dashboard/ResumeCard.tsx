import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { ActiveSession } from '../../utils/activeSession';
import { Button } from '../../components/ui/Primitives';
import { showAlert } from '../../components/ui/Dialog';
import { theme } from '../../constants/theme';
import { FilledPlay } from './FilledPlay';

// An unfinished session saved on device: the first thing on Today until it is resumed or discarded.
export const ResumeCard = ({ session, onResume, onDiscard }: { session: ActiveSession; onResume: (s: ActiveSession) => void; onDiscard: () => void }) => {
  const total = session.logs.reduce((n, e) => n + e.sets.length, 0);
  const done = session.logs.reduce((n, e) => n + e.sets.filter(s => s.completed).length, 0);
  const started = format(session.startTime, 'HH:mm');
  const confirmDiscard = () => showAlert('Discard this session?', `${done} logged ${done === 1 ? 'set' : 'sets'} from ${session.template.name} will be deleted. This cannot be undone.`, [
    { text: 'Keep session', style: 'cancel' },
    { text: 'Discard session', style: 'destructive', onPress: onDiscard },
  ]);
  return <View style={styles.card} accessibilityLabel={`Session in progress: ${session.template.name}, started ${started}, ${done} of ${total} sets done`}>
    <Text accessibilityRole="header" style={styles.name} numberOfLines={2}>{session.template.name}</Text>
    <Text style={styles.status}>In progress · started {started} · {done} of {total} sets</Text>
    <View style={styles.progressRow}>
      <View style={styles.track}>{session.logs.flatMap((e, i) => e.sets.map((s, j) =>
        <View key={`${i}-${j}`} style={[styles.pip, s.completed && styles.pipDone]} />))}</View>
    </View>
    <View style={styles.actions}>
      <Button label="Discard" variant="ghost" onPress={confirmDiscard} accessibilityLabel="Discard session in progress" style={styles.discard} />
      <View style={styles.grow}><Button label="Resume" icon={FilledPlay} onPress={() => onResume(session)} accessibilityLabel={`Resume ${session.template.name}`} style={styles.resume} /></View>
    </View>
  </View>;
};

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.radius.lg, padding: 16 },
  name: { ...theme.type.title, color: theme.colors.text },
  status: { ...theme.type.label, color: theme.colors.textSecondary, marginTop: 4, fontVariant: ['tabular-nums'] },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  track: { flex: 1, flexDirection: 'row', gap: 2, height: 8 },
  pip: { flex: 1, borderRadius: 1, backgroundColor: theme.colors.surfacePressed },
  pipDone: { backgroundColor: theme.colors.done },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  discard: { minHeight: 48, paddingHorizontal: 16 },
  grow: { flex: 1 }, resume: { minHeight: 52 },
});
