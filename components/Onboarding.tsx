import React, { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, Check, Dumbbell, LucideIcon, TrendingUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';
import { Button, PressableScale } from './ui/Primitives';
import { CATEGORY_LABEL, categoryColor } from '../utils/training';

export const ONBOARDING_KEY = 'onboarding-seen';

export const loadOnboardingSeen = () => AsyncStorage.getItem(ONBOARDING_KEY).then(v => v !== null, () => true);
export const markOnboardingSeen = () => AsyncStorage.setItem(ONBOARDING_KEY, '1').catch(() => undefined);

type Step = { icon: LucideIcon; title: string; body: string; extra?: 'set' | 'colors' };

const STEPS: Step[] = [
  { icon: Dumbbell, title: 'Build a routine', body: 'A routine is a workout you repeat: pick the exercises, the sets and a starting weight. Give it days of the week if you want it scheduled.' },
  { icon: CalendarDays, title: 'Start it from Today', body: "Today shows the session scheduled for today. Tap Start session, or use the round + button at the bottom to start any routine." },
  { icon: Check, title: 'Log every set', body: 'For each set, enter the weight and reps you actually did in the boxes under the barbell, then tap Set done. The rest timer starts on its own.', extra: 'set' },
  { icon: TrendingUp, title: 'Watch it add up', body: 'Finished sessions land in History. Progress shows your records and how your training is split. The coloured bars tell you what each session works:', extra: 'colors' },
];

// The bit of the set card a new lifter misses: the labelled boxes they type into.
const SetPreview = () => <View style={styles.preview} accessible={false} importantForAccessibility="no-hide-descendants">
  {[['Weight', '60', 'kg'], ['Reps', '8', 'reps']].map(([label, value, unit]) => <View key={label}>
    <Text style={styles.previewLabel}>{label}</Text>
    <View style={styles.previewBox}><Text style={styles.previewValue}>{value}</Text><Text style={styles.previewUnit}>{unit}</Text></View>
  </View>)}
  <View style={styles.previewDone}><Check size={16} color={theme.colors.onPrimary} strokeWidth={3} /><Text style={styles.previewDoneText}>Set done</Text></View>
</View>;

const ColorKey = () => <View style={styles.colors}>
  {([['push', 'chest, shoulders, triceps'], ['pull', 'back, biceps'], ['legs', 'squats, deadlifts, lunges'], ['cardio', 'runs, rides, rowing']] as const).map(([c, what]) =>
    <View key={c} style={styles.colorRow}>
      <View style={[styles.swatch, { backgroundColor: categoryColor(c) }]} />
      <Text style={styles.colorText}><Text style={styles.colorName}>{CATEGORY_LABEL[c]}</Text>  {what}</Text>
    </View>)}
</View>;

export const Onboarding = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [index, setIndex] = useState(0);
  const step = STEPS[index], last = index === STEPS.length - 1;
  const close = () => { setIndex(0); onClose(); };
  const Icon = step.icon;
  return <Modal visible={visible} animationType="fade" onRequestClose={close} statusBarTranslucent>
    <View style={styles.root}>
      <View style={styles.top}>
        <View style={styles.dots}>{STEPS.map((_, i) => <View key={i} style={[styles.dot, i === index && styles.dotOn]} />)}</View>
        {!last && <PressableScale accessibilityRole="button" accessibilityLabel="Skip the tour" onPress={close} style={styles.skip}><Text style={styles.skipText}>Skip</Text></PressableScale>}
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>How FlexTrack works · {index + 1} of {STEPS.length}</Text>
        <View style={styles.iconPlate}><Icon size={30} color={theme.colors.text} strokeWidth={2} /></View>
        <Text accessibilityRole="header" style={styles.title}>{step.title}</Text>
        <Text style={styles.text}>{step.body}</Text>
        {step.extra === 'set' && <SetPreview />}
        {step.extra === 'colors' && <ColorKey />}
      </ScrollView>
      <View style={styles.actions}>
        {index > 0 && <Button label="Back" variant="secondary" onPress={() => setIndex(index - 1)} style={styles.back} />}
        <Button label={last ? 'Get started' : 'Next'} onPress={() => (last ? close() : setIndex(index + 1))} style={styles.next} />
      </View>
    </View>
  </Modal>;
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.canvas, paddingTop: Platform.OS === 'ios' ? 60 : 36, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingHorizontal: 20 },
  top: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 18, height: 4, borderRadius: 2, backgroundColor: theme.colors.surfacePressed },
  dotOn: { backgroundColor: theme.colors.text },
  skip: { minHeight: 44, minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' },
  skipText: { ...theme.type.label, color: theme.colors.textMuted },
  body: { paddingTop: 32, gap: 14, maxWidth: 520, width: '100%', alignSelf: 'center' },
  kicker: { ...theme.type.caption, color: theme.colors.textSubtle, textTransform: 'uppercase', letterSpacing: 0.6 },
  iconPlate: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  title: { ...theme.type.display, color: theme.colors.text },
  text: { ...theme.type.body, fontSize: 17, lineHeight: 25, color: theme.colors.textSecondary },
  preview: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 14, gap: 10, marginTop: 6 },
  previewLabel: { ...theme.type.caption, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  previewBox: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.primary, backgroundColor: theme.colors.canvas },
  previewValue: { fontFamily: theme.type.metric.fontFamily, fontSize: 30, color: theme.colors.text },
  previewUnit: { ...theme.type.label, color: theme.colors.textMuted },
  previewDone: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: theme.radius.md, backgroundColor: theme.colors.primary },
  previewDoneText: { ...theme.type.button, color: theme.colors.onPrimary },
  colors: { gap: 10, marginTop: 6 },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swatch: { width: 28, height: 10, borderRadius: 2 },
  colorText: { ...theme.type.body, color: theme.colors.textMuted, flex: 1 },
  colorName: { fontFamily: theme.type.label.fontFamily, color: theme.colors.text },
  actions: { flexDirection: 'row', gap: 10, paddingTop: 12, maxWidth: 520, width: '100%', alignSelf: 'center' },
  back: { flex: 1, minHeight: 56 },
  next: { flex: 2, minHeight: 56 },
});
