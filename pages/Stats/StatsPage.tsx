import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Header } from '../../components/layout/Header';
import { PressableScale } from '../../components/ui/Primitives';
import { WorkoutLog, WorkoutTemplate, UserProfile } from '../../types';
import { TrainingTab } from './TrainingTab';
import { BodyTab } from './BodyTab';
import { theme } from '../../constants/theme';
import { WeightUnit } from '../../utils/units';

const TABS = [{ key: 'training', label: 'Training' }, { key: 'body', label: 'Body' }] as const;
const UNITS: { key: WeightUnit; word: string }[] = [{ key: 'kg', word: 'kilograms' }, { key: 'lb', word: 'pounds' }];
export type StatsTab = 'training' | 'body';

interface Props {
  logs: WorkoutLog[]; templates?: WorkoutTemplate[]; userProfile: UserProfile; setUserProfile: (p: UserProfile) => void;
  unit: WeightUnit; onUnitChange: (unit: WeightUnit) => void;
  // Held by App, so it survives the remount a unit change causes (switching to lb on Body stays on Body) and later visits.
  tab: StatsTab; onTabChange: (tab: StatsTab) => void;
}

export const StatsPage = ({ logs, templates, userProfile, setUserProfile, unit, onUnitChange, tab, onTabChange: setTab }: Props) => {
  // The app-wide weight unit. Everything is stored in kilograms, so switching only changes what is shown and typed.
  const unitSwitch = <View accessibilityRole="radiogroup" accessibilityLabel="Weight unit" style={styles.units}>
    {UNITS.map(u => { const on = unit === u.key; return <PressableScale key={u.key} accessibilityRole="radio" accessibilityLabel={`Show weights in ${u.word}`} accessibilityState={{ checked: on }}
      scaleTo={0.94} onPress={() => { if (!on) { void Haptics.selectionAsync(); onUnitChange(u.key); } }} style={[styles.unit, on && styles.unitOn]}>
      <Text style={[styles.unitText, on && styles.unitTextOn]}>{u.key}</Text>
    </PressableScale>; })}
  </View>;
  return <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    <Header title="Progress" rightAction={unitSwitch} />
    <View style={styles.inner}>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {TABS.map(t => { const on = tab === t.key; return <View key={t.key} style={styles.tabCell}><PressableScale accessibilityRole="tab" accessibilityLabel={t.label} accessibilityState={{ selected: on }} scaleTo={0.97}
          onPress={() => { if (!on) { Haptics.selectionAsync(); setTab(t.key); } }} style={[styles.tab, on && styles.tabActive]}>
          <Text style={[styles.tabText, on && styles.tabTextActive]}>{t.label}</Text>
        </PressableScale></View>; })}
      </View>
      {tab === 'training' ? <TrainingTab logs={logs} templates={templates} /> : <BodyTab userProfile={userProfile} setUserProfile={setUserProfile} />}
    </View>
  </ScrollView>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.canvas },
  scroll: { paddingBottom: 110 },
  inner: { paddingHorizontal: 16, maxWidth: 620, width: '100%', alignSelf: 'center' },
  tabs: { padding: 4, gap: 4, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, flexDirection: 'row', marginBottom: 16 },
  tabCell: { flex: 1 },
  tab: { minHeight: 44, borderRadius: theme.radius.sm, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: theme.colors.primary },
  tabText: { ...theme.type.label, fontSize: 15, color: theme.colors.textMuted },
  tabTextActive: { color: theme.colors.onPrimary },
  units: { flexDirection: 'row', padding: 3, gap: 2, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface },
  unit: { minWidth: 44, minHeight: 38, paddingHorizontal: 10, borderRadius: theme.radius.sm, alignItems: 'center', justifyContent: 'center' },
  unitOn: { backgroundColor: theme.colors.primary },
  unitText: { ...theme.type.label, color: theme.colors.textMuted },
  unitTextOn: { color: theme.colors.onPrimary },
});
