import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Header } from '../../components/layout/Header';
import { PressableScale } from '../../components/ui/Primitives';
import { WorkoutLog, UserProfile } from '../../types';
import { TrainingTab } from './TrainingTab';
import { BodyTab } from './BodyTab';
import { theme } from '../../constants/theme';

const TABS = [{ key: 'training', label: 'Training' }, { key: 'body', label: 'Body' }] as const;

export const StatsPage = ({ logs, userProfile, setUserProfile }: { logs: WorkoutLog[]; userProfile: UserProfile; setUserProfile: (p: UserProfile) => void }) => {
  const [tab, setTab] = useState<'training' | 'body'>('training');
  return <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    <Header title="Progress" />
    <View style={styles.inner}>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {TABS.map(t => { const on = tab === t.key; return <View key={t.key} style={styles.tabCell}><PressableScale accessibilityRole="tab" accessibilityLabel={t.label} accessibilityState={{ selected: on }} scaleTo={0.97}
          onPress={() => { if (!on) { Haptics.selectionAsync(); setTab(t.key); } }} style={[styles.tab, on && styles.tabActive]}>
          <Text style={[styles.tabText, on && styles.tabTextActive]}>{t.label}</Text>
        </PressableScale></View>; })}
      </View>
      {tab === 'training' ? <TrainingTab logs={logs} /> : <BodyTab userProfile={userProfile} setUserProfile={setUserProfile} />}
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
});
