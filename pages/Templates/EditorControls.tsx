import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../constants/theme';
import { PressableScale } from '../../components/ui/Primitives';
import { Exercise } from '../../types';

const { colors, type, radius } = theme;

// Seconds as m:ss ("1:30"); the editor shows every duration this way.
export const formatClock = (seconds = 0) => {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// Accepts "1:30", "90" or "1.5" style input. Plain numbers are seconds.
export const parseClock = (text: string) => {
  const t = text.trim();
  if (!t) return NaN;
  if (t.includes(':')) {
    const [m, s = '0'] = t.split(':');
    const mm = parseInt(m || '0', 10), ss = parseInt(s || '0', 10);
    return Number.isFinite(mm) && Number.isFinite(ss) ? mm * 60 + ss : NaN;
  }
  return Math.round(parseFloat(t.replace(',', '.')));
};

export const formatAmount = (n = 0) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));
const parseAmount = (text: string) => parseFloat(text.replace(',', '.'));

// One line that reads like the whiteboard: "4 × 6 · 80 kg · rest 1:30".
export const exerciseSummary = (e: Exercise) => {
  const sets = e.targetSets ?? 1;
  const parts: string[] = [];
  if (e.type === 'timer') parts.push(`${sets} × ${formatClock(e.targetDurationSeconds)}`);
  else if (e.type === 'distance') parts.push(`${sets > 1 ? `${sets} × ` : ''}${formatAmount(e.targetDistance)} ${e.targetDistanceUnit || 'km'}`);
  else {
    parts.push(`${sets} × ${e.targetReps ?? 0}`);
    const mode = e.loadMode || 'external', w = e.targetWeight || 0;
    if (mode === 'bodyweight') parts.push('bodyweight');
    else if (mode === 'assisted') parts.push(`${formatAmount(w)} kg assist`);
    else if (w > 0) parts.push(`${formatAmount(w)} kg`);
  }
  const rest = e.restSeconds || 0;
  parts.push(rest > 0 ? `rest ${formatClock(rest)}` : 'no rest');
  return parts.join(' · ');
};

type StepperProps = {
  label: string;
  a11y: string; // e.g. "Sets for Bench Press"
  value: number | undefined;
  onChange: (v: number) => void;
  step: number;
  min?: number;
  max: number;
  integer?: boolean;
  clock?: boolean;
};

export const EditorStepper = ({ label, a11y, value = 0, onChange, step, min = 0, max, integer, clock }: StepperProps) => {
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (v: number) => {
    const bounded = Math.min(max, Math.max(min, v));
    return integer || clock ? Math.round(bounded) : Math.round(bounded * 100) / 100;
  };
  const show = (v: number) => (clock ? formatClock(v) : formatAmount(v));
  const parse = (t: string) => (clock ? parseClock(t) : parseAmount(t));
  const nudge = (dir: 1 | -1) => {
    const next = clamp((Math.round(value / step) + dir) * step);
    if (next === value) return;
    Haptics.selectionAsync();
    setDraft(null);
    onChange(next);
  };
  const lower = a11y.charAt(0).toLowerCase() + a11y.slice(1);
  return <View style={styles.stepper}>
    <Text style={styles.stepperLabel}>{label}</Text>
    <View style={styles.stepperRow}>
      <PressableScale accessibilityRole="button" accessibilityLabel={`Decrease ${lower}`} accessibilityState={{ disabled: value <= min }} disabled={value <= min}
        onPress={() => nudge(-1)} scaleTo={0.92} style={[styles.stepBtn, value <= min && styles.stepBtnOff]}>
        <Minus size={18} color={colors.text} strokeWidth={2.4} />
      </PressableScale>
      <TextInput
        accessibilityLabel={a11y}
        value={draft ?? show(value)}
        onFocus={() => setDraft(show(value))}
        onChangeText={t => { setDraft(t); const v = parse(t); if (Number.isFinite(v)) onChange(clamp(v)); }}
        onBlur={() => setDraft(null)}
        keyboardType={clock ? 'numbers-and-punctuation' : integer ? 'number-pad' : 'decimal-pad'}
        selectTextOnFocus
        style={styles.stepInput}
      />
      <PressableScale accessibilityRole="button" accessibilityLabel={`Increase ${lower}`} accessibilityState={{ disabled: value >= max }} disabled={value >= max}
        onPress={() => nudge(1)} scaleTo={0.92} style={[styles.stepBtn, value >= max && styles.stepBtnOff]}>
        <Plus size={18} color={colors.text} strokeWidth={2.4} />
      </PressableScale>
    </View>
  </View>;
};

type Option<T extends string> = { value: T; label: string; a11y?: string };

export const EditorSegmented = <T extends string>({ options, value, onChange, style }: {
  options: Option<T>[]; value: T; onChange: (v: T) => void; style?: object;
}) => (
  <View accessibilityRole="radiogroup" style={[styles.segment, style]}>
    {options.map(o => {
      const on = o.value === value;
      return <View key={o.value} style={styles.segmentCell}><PressableScale accessibilityRole="radio" accessibilityLabel={o.a11y ?? o.label} accessibilityState={{ checked: on, selected: on }}
        onPress={() => { if (!on) { Haptics.selectionAsync(); onChange(o.value); } }} scaleTo={0.96} style={[styles.segmentBtn, on && styles.segmentBtnOn]}>
        <Text numberOfLines={1} style={[styles.segmentText, on && styles.segmentTextOn]}>{o.label}</Text>
      </PressableScale></View>;
    })}
  </View>
);

const styles = StyleSheet.create({
  stepper: { flexGrow: 1, flexBasis: 150, gap: 6 },
  stepperLabel: { ...type.caption, color: colors.textMuted },
  stepperRow: { flexDirection: 'row', alignItems: 'stretch', gap: 4 },
  stepBtn: { width: 44, height: 48, borderRadius: radius.sm, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  stepBtnOff: { opacity: 0.4 },
  stepInput: {
    flex: 1, minWidth: 0, height: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.canvas,
    color: colors.text, textAlign: 'center', fontFamily: type.metric.fontFamily, fontSize: 24, fontVariant: ['tabular-nums'], paddingHorizontal: 4,
  },
  segment: { flexDirection: 'row', backgroundColor: colors.canvas, borderRadius: radius.md, padding: 2, gap: 2 },
  segmentCell: { flexGrow: 1 },
  segmentBtn: { minHeight: 44, minWidth: 46, paddingHorizontal: 6, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  segmentBtnOn: { backgroundColor: colors.primary },
  segmentText: { ...type.label, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  segmentTextOn: { color: colors.onPrimary },
});
