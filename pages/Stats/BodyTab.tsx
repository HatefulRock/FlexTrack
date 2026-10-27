import React, { useMemo, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import { Scale } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BodyMetricLog, UserProfile } from '../../types';
import { Button, Chip, SectionHeader } from '../../components/ui/Primitives';
import { theme } from '../../constants/theme';
import { DAY_MS, shortDate, trimNumber } from './chartUtils';
import { LineChartSvg } from './LineChartSvg';

const RANGES = [{ key: '30', label: '30d', days: 30 }, { key: '90', label: '90d', days: 90 }, { key: 'all', label: 'All', days: 0 }] as const;
type RangeKey = typeof RANGES[number]['key'];
const AVG_N = 7;

// WHO adult BMI bands, with a coarse position inside the band so the reading is words, not a colour.
const bmiCategory = (bmi: number) => {
  const bands: [number, number, string][] = [[0, 18.5, 'Underweight'], [18.5, 25, 'Healthy range'], [25, 30, 'Overweight'], [30, 35, 'Obesity class I'], [35, 40, 'Obesity class II'], [40, Infinity, 'Obesity class III']];
  const [lo, hi, name] = bands.find(([a, b]) => bmi >= a && bmi < b) || bands[0];
  if (!Number.isFinite(hi) || lo === 0) return name;
  const pos = (bmi - lo) / (hi - lo);
  return pos >= 0.7 ? `${name}, upper end` : pos < 0.3 ? `${name}, lower end` : name;
};

export const BodyTab = ({ userProfile, setUserProfile }: { userProfile: UserProfile; setUserProfile: (p: UserProfile) => void | Promise<void> }) => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState(userProfile.height ? String(userProfile.height) : '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [range, setRange] = useState<RangeKey>('90');
  const validLogs = useMemo(() => userProfile.weightLogs.filter(l => Number.isFinite(l.date) && Number.isFinite(l.weight) && l.weight > 0).sort((a, b) => a.date - b.date), [userProfile.weightLogs]);
  const latest = validLogs.at(-1);
  const current = latest?.weight || 0;
  const bmi = userProfile.height && current ? current / ((userProfile.height / 100) ** 2) : 0;

  const chart = useMemo(() => {
    const days = RANGES.find(r => r.key === range)!.days;
    const from = days ? Date.now() - days * DAY_MS : -Infinity;
    // Moving average over the whole history, so the first points of a short range still average 7 real entries.
    const avg = validLogs.length >= AVG_N ? validLogs.map((l, i) => i < AVG_N - 1 ? null : { t: l.date, value: validLogs.slice(i - AVG_N + 1, i + 1).reduce((s, x) => s + x.weight, 0) / AVG_N }).filter((p): p is { t: number; value: number } => !!p && p.t >= from) : [];
    const points = validLogs.filter(l => l.date >= from).map(l => ({ t: l.date, value: l.weight }));
    return { points, average: avg.length > 1 && points.length > 1 ? avg : undefined };
  }, [validLogs, range]);

  const saveWeight = async () => {
    const value = Number(weight.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) { setMessage({ text: 'Enter a weight in kg greater than zero.', error: true }); return; }
    setSaving(true); setMessage(null);
    const entry: BodyMetricLog = { date: Date.now(), weight: value };
    try {
      await setUserProfile({ ...userProfile, weightLogs: [...validLogs, entry].sort((a, b) => a.date - b.date) });
      setWeight(''); Keyboard.dismiss(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMessage({ text: `Saved ${trimNumber(value, 1)} kg`, error: false });
    } catch { setMessage({ text: 'Could not save your weight. Try again.', error: true }); }
    finally { setSaving(false); }
  };
  const saveHeight = async () => { const value = Number(height.replace(',', '.')); if (Number.isFinite(value) && value > 0) await setUserProfile({ ...userProfile, height: value }); };

  const { points, average } = chart;
  const first = points[0], last = points[points.length - 1];
  const diff = points.length > 1 ? last.value - first.value : 0;
  const days = points.length > 1 ? Math.max(1, Math.round((last.t - first.t) / DAY_MS)) : 0;
  const deltaText = points.length > 1 ? (Math.abs(diff) < 0.05 ? `No change in ${days} days` : `${diff > 0 ? '+' : '−'}${trimNumber(Math.abs(diff), 1)} kg in ${days} ${days === 1 ? 'day' : 'days'}`) : '';
  const describe = points.length > 1 ? `Bodyweight, ${points.length} entries from ${trimNumber(first.value, 1)} kg on ${shortDate(first.t, true)} to ${trimNumber(last.value, 1)} kg on ${shortDate(last.t, true)}.` : '';

  return <View style={styles.container}>
    <View style={styles.card}>
      <View style={styles.scoreRow}>
        <View style={styles.scoreCell}>
          <Text style={styles.caption}>Weight</Text>
          <Text style={styles.score} accessibilityLabel={current ? `Current weight ${trimNumber(current, 1)} kilograms` : 'No weight logged'}>{current ? trimNumber(current, 1) : '–'}<Text style={styles.scoreUnit}> kg</Text></Text>
        </View>
        <Text style={styles.scoreSep}>·</Text>
        <View style={styles.scoreCell}>
          <Text style={styles.caption}>Height</Text>
          <View style={styles.heightRow}>
            <TextInput accessibilityLabel="Height in centimetres" value={height} onChangeText={setHeight} onBlur={saveHeight} onSubmitEditing={saveHeight} keyboardType="decimal-pad" returnKeyType="done"
              placeholder="Add" placeholderTextColor={theme.colors.textSubtle} selectionColor={theme.colors.text} style={styles.heightInput} maxLength={5} />
            <Text style={styles.scoreUnit}>cm</Text>
          </View>
        </View>
      </View>
      <View style={styles.bmiRow}>
        <Text style={styles.bmiLabel}>BMI</Text>
        {bmi ? <Text style={styles.bmiText}><Text style={styles.bmiValue}>{bmi.toFixed(1)}</Text>{`  ${bmiCategory(bmi)}`}</Text>
          : <Text style={styles.bmiHint}>{current ? 'Add your height to see BMI.' : 'Log your weight to see BMI.'}</Text>}
      </View>
      {!!latest && <Text style={styles.caption}>Latest weigh-in {shortDate(latest.date, true)}</Text>}
    </View>

    <View>
      <SectionHeader title="Log weight" />
      <View style={styles.card}>
        <View style={styles.controls}>
          <TextInput accessibilityLabel="Weight in kilograms" value={weight} onChangeText={setWeight} onSubmitEditing={saveWeight} keyboardType="decimal-pad" returnKeyType="done"
            placeholder="Weight in kg" placeholderTextColor={theme.colors.textSubtle} selectionColor={theme.colors.text} style={styles.weightInput} />
          <Button label="Log weight" onPress={saveWeight} loading={saving} style={styles.logButton} />
        </View>
        {message && <Text accessibilityRole={message.error ? 'alert' : undefined} accessibilityLiveRegion="polite" style={[styles.message, message.error && styles.error]}>{message.text}</Text>}
      </View>
    </View>

    <View>
      <SectionHeader title="Weight trend" />
      <View style={styles.card}>
        {validLogs.length ? <>
          <View style={styles.ranges}>{RANGES.map(r => <View key={r.key} style={styles.rangeCell}><Chip label={r.label} active={range === r.key} accessibilityLabel={r.days ? `Last ${r.days} days` : 'All entries'} onPress={() => setRange(r.key)} /></View>)}</View>
          {points.length > 1 ? <>
            <LineChartSvg points={points} average={average} unit="kg" describe={describe} height={210} />
            <View style={styles.footer}>
              <Text style={styles.delta}>{deltaText}</Text>
              {average && <View style={styles.legend}>
                <View style={styles.legendItem}><View style={[styles.legendLine, { backgroundColor: theme.colors.text }]} /><Text style={styles.caption}>Entries</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendLine, { backgroundColor: theme.colors.textSubtle }]} /><Text style={styles.caption}>{AVG_N}-entry average</Text></View>
              </View>}
            </View>
          </> : <View style={styles.empty}>
            <Text style={styles.emptyText}>{points.length === 1 ? `One entry in this range (${trimNumber(points[0].value, 1)} kg). Log another to draw a line.` : 'No entries in this range.'}</Text>
          </View>}
        </> : <View style={styles.empty}>
          <Scale size={28} color={theme.colors.textMuted} strokeWidth={1.75} />
          <Text style={styles.emptyTitle}>No weight logged</Text>
          <Text style={styles.emptyText}>Log a weigh-in above. Two entries draw your trend.</Text>
        </View>}
      </View>
    </View>
  </View>;
};

const styles = StyleSheet.create({
  container: { gap: 24 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 16, gap: 4 },
  caption: { ...theme.type.caption, color: theme.colors.textMuted },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  scoreCell: { gap: 2 },
  score: { ...theme.type.display, fontSize: 44, lineHeight: 48, fontVariant: ['tabular-nums'], color: theme.colors.text },
  scoreUnit: { fontFamily: theme.type.label.fontFamily, fontSize: 16, lineHeight: 20, letterSpacing: 0, color: theme.colors.textMuted },
  scoreSep: { ...theme.type.display, fontSize: 44, lineHeight: 48, color: theme.colors.textSubtle },
  heightRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  heightInput: { ...theme.type.display, fontSize: 40, lineHeight: 44, fontVariant: ['tabular-nums'], color: theme.colors.text, width: 96, minHeight: 48, paddingHorizontal: 8, paddingVertical: 0,
    borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.sm, backgroundColor: theme.colors.canvas },
  bmiRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  bmiLabel: { ...theme.type.label, color: theme.colors.textMuted, width: 36 },
  bmiText: { ...theme.type.body, color: theme.colors.textSecondary, flex: 1 },
  bmiValue: { fontFamily: theme.type.metric.fontFamily, fontSize: 28, lineHeight: 32, fontVariant: ['tabular-nums'], color: theme.colors.text },
  bmiHint: { ...theme.type.body, color: theme.colors.textMuted, flex: 1 },
  controls: { flexDirection: 'row', gap: 8 },
  weightInput: { flex: 1, minHeight: 52, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.canvas, color: theme.colors.text,
    paddingHorizontal: 14, fontFamily: theme.type.label.fontFamily, fontSize: 17 },
  logButton: { minHeight: 52 },
  message: { ...theme.type.caption, color: theme.colors.textSecondary, marginTop: 8 },
  error: { color: theme.colors.danger },
  ranges: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  rangeCell: { flex: 1 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 },
  delta: { fontFamily: theme.type.label.fontFamily, fontSize: 15, lineHeight: 20, fontVariant: ['tabular-nums'], color: theme.colors.textMuted },
  legend: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 14, height: 2, borderRadius: 1 },
  empty: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  emptyTitle: { ...theme.type.heading, color: theme.colors.text },
  emptyText: { ...theme.type.body, color: theme.colors.textMuted, textAlign: 'center' },
});
