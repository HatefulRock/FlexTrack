import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { WorkoutLog } from '../../types';
import { theme } from '../../constants/theme';
import { Share2 } from 'lucide-react-native';
import { Button, SectionHeader, useReducedMotion } from '../../components/ui/Primitives';
import { detectRecords, formatDuration, formatNumber, logVolume } from '../../utils/training';
import { ExerciseRow, JudgeLights, RecordCard, lightsVerdict, whiteLights } from './SummaryParts';
import { buildShareData } from './ShareLayout';
import { ShareSheet } from './ShareSheet';

const c = theme.colors;
const nd = theme.motion.nativeDriver;

interface Props { log: WorkoutLog; previousLogs?: WorkoutLog[]; onDone: () => void; onViewHistory?: () => void; }

export const WorkoutSummaryPage = ({ log, previousLogs = [], onDone, onViewHistory }: Props) => {
  const reduced = useReducedMotion();

  const stats = useMemo(() => {
    const totalSets = log.exercises.reduce((n, e) => n + e.sets.length, 0);
    const doneSets = log.exercises.reduce((n, e) => n + e.sets.filter(s => s.completed).length, 0);
    const volume = logVolume(log);
    const records = detectRecords(log, previousLogs);
    const start = log.startTime;
    const previous = log.templateId ? previousLogs
      .filter(l => l.id !== log.id && l.templateId === log.templateId && l.startTime < start)
      .sort((a, b) => b.startTime - a.startTime)[0] : undefined;
    const delta = previous ? Math.round(volume - logVolume(previous)) : null;
    return { totalSets, doneSets, volume, records, delta, duration: (log.endTime || log.startTime) - log.startTime };
  }, [log, previousLogs]);
  const { totalSets, doneSets, volume, records, delta, duration } = stats;
  const complete = totalSets > 0 && doneSets === totalSets;
  const [shareOpen, setShareOpen] = useState(false);
  const shareData = useMemo(() => buildShareData(log, stats), [log, stats]);
  const openShare = () => { Haptics.selectionAsync().catch(() => undefined); setShareOpen(true); };

  const white = whiteLights(doneSets, totalSets);
  const title = records.length ? 'New record.' : complete ? 'Session complete.' : 'Partial session saved.';
  // A record session leads with the record band, so the completion lights (which may be red) stay off it.
  const subtitle = [
    records.length ? `${records.length} ${records.length === 1 ? 'record' : 'records'}` : lightsVerdict(white),
    log.templateName,
  ].filter(Boolean).join(' · ');

  // Choreography: lights spring in, copy fades up, volume counts, records land last. Buttons are live from frame one.
  const lights = useRef([0, 1, 2].map(() => new Animated.Value(0.85))).current;
  const board = useRef(new Animated.Value(0)).current;
  const rise = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const recordIn = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const count = useRef(new Animated.Value(0)).current;
  const [shownVolume, setShownVolume] = useState(0);
  const buzzed = useRef(false);

  useEffect(() => {
    if (buzzed.current) return;
    buzzed.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, []);

  useEffect(() => {
    const all = [...lights, board, ...rise, recordIn, count];
    all.forEach(v => v.stopAnimation());
    if (reduced) {
      lights.forEach(v => v.setValue(1)); board.setValue(1); rise.forEach(v => v.setValue(1)); recordIn.setValue(1);
      count.setValue(volume); setShownVolume(volume);
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 150, useNativeDriver: nd }).start();
      return;
    }
    const id = count.addListener(({ value }) => setShownVolume(value));
    const anim = Animated.parallel([
      Animated.timing(board, { toValue: 1, duration: 160, easing: theme.motion.easeOut, useNativeDriver: nd }),
      Animated.stagger(60, lights.map(v => Animated.spring(v, { toValue: 1, stiffness: 180, damping: 14, mass: 1, useNativeDriver: nd }))),
      Animated.sequence([Animated.delay(120), Animated.stagger(50, rise.map(v => Animated.timing(v, { toValue: 1, duration: 260, easing: theme.motion.easeOut, useNativeDriver: nd })))]),
      Animated.sequence([Animated.delay(150), Animated.timing(count, { toValue: volume, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false })]),
    ]);
    anim.start();
    let recordTimer: ReturnType<typeof setTimeout> | undefined;
    if (records.length) {
      recordTimer = setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
        Animated.timing(recordIn, { toValue: 1, duration: 240, easing: theme.motion.easeOut, useNativeDriver: nd }).start();
      }, 400);
    } else recordIn.setValue(1);
    return () => { count.removeListener(id); anim.stop(); if (recordTimer) clearTimeout(recordTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const up = (v: Animated.Value) => ({ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] });
  const recordStyle = { opacity: recordIn, transform: [{ scale: recordIn.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] };
  // Only a complete session is a fair comparison with the last one.
  const fairDelta = delta === null || !complete ? null : delta;
  const deltaText = fairDelta === null ? null
    : fairDelta > 0 ? `+${formatNumber(fairDelta)} kg vs last`
    : fairDelta < 0 ? `−${formatNumber(-fairDelta)} kg vs last`
    : 'Same as last';
  const deltaSpoken = fairDelta === null ? ''
    : fairDelta === 0 ? ', same as last session'
    : `, ${formatNumber(Math.abs(fairDelta))} kilograms ${fairDelta > 0 ? 'more' : 'less'} than last session`;

  return <View style={styles.container}>
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.content, { opacity: fade }]}>
        <View style={styles.hero}>
          {!records.length && <JudgeLights scales={lights} opacity={board} white={white} />}
          <Animated.View style={up(rise[0])}>
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
            <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
          </Animated.View>
        </View>

        {records.length > 0 && <Animated.View style={[styles.records, recordStyle]}>
          {records.map((r, i) => <RecordCard key={`${r.exerciseName}-${i}`} record={r} />)}
        </Animated.View>}

        <Animated.View style={[styles.scoreboard, up(rise[1])]}>
          <Score value={formatDuration(duration)} label="Duration" />
          <View style={styles.divider} />
          <Score value={String(doneSets)} label={complete ? 'Sets' : `of ${totalSets} sets`} />
          <View style={styles.divider} />
          <View style={styles.score} accessible accessibilityLabel={`Volume ${formatNumber(volume)} kilograms${deltaSpoken}`}>
            <Text style={styles.scoreValue} numberOfLines={1}>{formatNumber(shownVolume)}<Text style={styles.scoreUnit}> kg</Text></Text>
            <Text style={styles.scoreLabel}>Volume</Text>
            {deltaText && <Text style={[styles.delta, fairDelta > 0 ? styles.deltaUp : styles.deltaFlat]}>{deltaText}</Text>}
          </View>
        </Animated.View>

        <Animated.View style={up(rise[2])}>
          <SectionHeader title="Exercises" />
          <View style={styles.list}>{log.exercises.map((e, i) => <ExerciseRow key={`${e.exerciseId}-${i}`} exercise={e} first={i === 0} />)}</View>
        </Animated.View>
      </Animated.View>
    </ScrollView>
    <SafeAreaView edges={['bottom']} style={styles.footer}>
      {onViewHistory && <Button label="View in history" variant="secondary" onPress={onViewHistory} style={styles.footerButton} />}
      <Button label="Share" icon={Share2} variant="secondary" accessibilityLabel="Share session as an image" onPress={openShare} style={styles.footerButton} />
      <View style={styles.flex}><Button label="Done" onPress={onDone} /></View>
    </SafeAreaView>
    <ShareSheet visible={shareOpen} onClose={() => setShareOpen(false)} data={shareData} />
  </View>;
};

const Score = ({ value, label }: { value: string; label: string }) => (
  <View style={styles.score} accessible accessibilityLabel={`${label} ${value}`}>
    <Text style={styles.scoreValue} numberOfLines={1}>{value}</Text>
    <Text style={styles.scoreLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.canvas },
  flex: { flex: 1 },
  scroll: { paddingTop: 28, paddingBottom: 24 },
  content: { paddingHorizontal: 16, gap: 24, maxWidth: 620, width: '100%', alignSelf: 'center' },
  hero: { gap: 20 },
  title: { ...theme.type.display, fontSize: 48, lineHeight: 50, color: c.text },
  subtitle: { ...theme.type.body, color: c.textMuted, marginTop: 6 },
  scoreboard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: c.surface, borderRadius: theme.radius.lg, paddingVertical: 14, paddingHorizontal: 4 },
  score: { flex: 1, paddingHorizontal: 12, gap: 2 },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: c.border },
  scoreValue: { fontFamily: theme.type.metric.fontFamily, fontSize: 34, lineHeight: 38, fontVariant: ['tabular-nums'], color: c.text },
  scoreUnit: { fontFamily: theme.type.metric.fontFamily, fontSize: 18, color: c.textMuted },
  scoreLabel: { ...theme.type.caption, color: c.textMuted },
  delta: { ...theme.type.caption, fontFamily: theme.type.numeric.fontFamily, fontVariant: ['tabular-nums'], marginTop: 4 },
  deltaUp: { color: c.text },
  deltaFlat: { color: c.textMuted },
  records: { gap: 8 },
  list: { backgroundColor: c.surface, borderRadius: theme.radius.lg, overflow: 'hidden' },
  footerButton: { paddingHorizontal: 16 },
  footer: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 8, backgroundColor: c.canvas, maxWidth: 620, width: '100%', alignSelf: 'center' },
});
