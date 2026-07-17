import React, { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarDays, Dumbbell, History, Plus, TrendingUp, X, Play, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ViewState, WorkoutTemplate } from '../../types';
import { theme } from '../../constants/theme';
import { Button } from '../ui/Primitives';

interface NavigationProps {
  currentView: ViewState | 'template-editor';
  setView: (v: ViewState) => void;
  templates: WorkoutTemplate[];
  onStart: (template: WorkoutTemplate) => void;
  onCreate: () => void;
  onQuickLog: () => void;
}

const tabs: { view: ViewState; label: string; icon: typeof CalendarDays }[] = [
  { view: 'dashboard', label: 'Today', icon: CalendarDays },
  { view: 'templates', label: 'Workouts', icon: Dumbbell },
  { view: 'history', label: 'History', icon: History },
  { view: 'stats', label: 'Progress', icon: TrendingUp },
];

export const Navigation = ({ currentView, setView, templates, onStart, onCreate, onQuickLog }: NavigationProps) => {
  const [quickOpen, setQuickOpen] = useState(false);
  const navigate = (view: ViewState) => { Haptics.selectionAsync(); setView(view); };
  const start = (template: WorkoutTemplate) => { setQuickOpen(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onStart(template); };

  return <>
    <View style={styles.container}>
      {tabs.slice(0, 2).map(({ view, label, icon: Icon }) => <NavItem key={view} {...{ view, label, Icon, currentView, navigate }} />)}
      <View style={styles.quickSlot}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Quick start workout" onPress={() => setQuickOpen(true)} style={styles.quickButton}><Plus size={26} color={theme.colors.canvas} strokeWidth={3} /></TouchableOpacity><Text style={styles.quickLabel}>Quick start</Text></View>
      {tabs.slice(2).map(({ view, label, icon: Icon }) => <NavItem key={view} {...{ view, label, Icon, currentView, navigate }} />)}
    </View>

    <Modal visible={quickOpen} transparent animationType="slide" onRequestClose={() => setQuickOpen(false)}>
      <View style={styles.modalRoot}><TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={() => setQuickOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}><View><Text style={styles.sheetEyebrow}>QUICK START</Text><Text style={styles.sheetTitle}>Start moving</Text></View><TouchableOpacity accessibilityLabel="Close" onPress={() => setQuickOpen(false)} style={styles.close}><X size={22} color={theme.colors.textMuted} /></TouchableOpacity></View>
          {templates.length ? <><Text style={styles.sheetLabel}>Your routines</Text><ScrollView style={styles.routines} showsVerticalScrollIndicator={false}>
            {templates.slice(0, 4).map(t => <TouchableOpacity key={t.id} onPress={() => start(t)} style={styles.routine}>
              <View style={styles.playCircle}><Play size={16} color={theme.colors.primary} fill={theme.colors.primary} /></View><View style={styles.routineText}><Text style={styles.routineTitle}>{t.name}</Text><Text style={styles.routineMeta}>{t.exercises.length} exercises</Text></View><ChevronRight size={20} color={theme.colors.textSubtle} />
            </TouchableOpacity>)}
          </ScrollView></> : <Text style={styles.emptyText}>Create your first routine to make quick starts effortless.</Text>}
          <Button label="Log completed activity" variant="primary" onPress={() => { setQuickOpen(false); onQuickLog(); }} />
          <Button label="Create new routine" icon={Plus} style={{ marginTop: 10 }} variant={templates.length ? 'secondary' : 'primary'} onPress={() => { setQuickOpen(false); onCreate(); }} />
        </View>
      </View>
    </Modal>
  </>;
};

const NavItem = ({ view, label, Icon, currentView, navigate }: any) => {
  const active = currentView === view || (view === 'templates' && currentView === 'template-editor');
  return <TouchableOpacity accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => navigate(view)} style={styles.navItem}>
    <Icon size={22} color={active ? theme.colors.primary : theme.colors.textSubtle} strokeWidth={active ? 2.5 : 2} />
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>{active && <View style={styles.activeDot} />}
  </TouchableOpacity>;
};

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, bottom: 0, height: Platform.OS === 'ios' ? 88 : 76, paddingBottom: Platform.OS === 'ios' ? 14 : 4, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border, zIndex: 50 },
  navItem: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 3 }, navLabel: { fontSize: 10, fontWeight: '600', color: theme.colors.textSubtle }, navLabelActive: { color: theme.colors.text }, activeDot: { position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.primary },
  quickSlot: { width: 72, alignItems: 'center', marginTop: -22 }, quickButton: { width: 54, height: 54, borderRadius: 27, backgroundColor: theme.colors.primary, borderWidth: 5, borderColor: theme.colors.canvas, alignItems: 'center', justifyContent: 'center', ...theme.shadow.glow }, quickLabel: { fontSize: 9, color: theme.colors.textMuted, marginTop: 2, fontWeight: '600' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' }, scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay },
  sheet: { maxHeight: '82%', backgroundColor: theme.colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: theme.colors.border, padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 22 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.borderStrong, alignSelf: 'center', marginBottom: 20 }, sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  sheetEyebrow: { ...theme.type.caption, color: theme.colors.primary, letterSpacing: 1.4 }, sheetTitle: { ...theme.type.title, color: theme.colors.text }, close: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  sheetLabel: { ...theme.type.label, color: theme.colors.textMuted, marginBottom: 8 }, routines: { maxHeight: 280, marginBottom: 16 }, routine: { minHeight: 68, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: 12 },
  playCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, routineText: { flex: 1 }, routineTitle: { ...theme.type.label, color: theme.colors.text }, routineMeta: { ...theme.type.caption, color: theme.colors.textMuted, marginTop: 2 }, emptyText: { ...theme.type.body, color: theme.colors.textMuted, marginBottom: 24 },
});



