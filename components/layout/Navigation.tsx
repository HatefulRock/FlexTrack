import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, Dumbbell, History, Plus, TrendingUp, X, Play, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ViewState, WorkoutTemplate } from '../../types';
import { theme } from '../../constants/theme';
import { Button, PressableScale, useReducedMotion } from '../ui/Primitives';

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
  { view: 'templates', label: 'Routines', icon: Dumbbell },
  { view: 'history', label: 'History', icon: History },
  { view: 'stats', label: 'Progress', icon: TrendingUp },
];

export const Navigation = ({ currentView, setView, templates, onStart, onCreate, onQuickLog }: NavigationProps) => {
  const [quickOpen, setQuickOpen] = useState(false);
  const navigate = (view: ViewState) => { Haptics.selectionAsync(); setView(view); };
  const open = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setQuickOpen(true); };
  const start = (template: WorkoutTemplate) => { setQuickOpen(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onStart(template); };

  return <>
    <View accessibilityRole="tablist" style={styles.container}>
      {tabs.slice(0, 2).map(({ view, label, icon: Icon }) => <NavItem key={view} {...{ view, label, Icon, currentView, navigate }} />)}
      <View style={styles.quickSlot}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Quick start" onPress={open} scaleTo={0.92} style={styles.quickButton}>
          <Plus size={26} color={theme.colors.onPrimary} strokeWidth={2.75} />
        </PressableScale>
      </View>
      {tabs.slice(2).map(({ view, label, icon: Icon }) => <NavItem key={view} {...{ view, label, Icon, currentView, navigate }} />)}
    </View>

    <Sheet visible={quickOpen} onClose={() => setQuickOpen(false)}>
      <View style={styles.sheetHeader}>
        <Text accessibilityRole="header" style={styles.sheetTitle}>Start moving</Text>
        <PressableScale accessibilityRole="button" accessibilityLabel="Close" onPress={() => setQuickOpen(false)} scaleTo={0.92} style={styles.close}><X size={22} color={theme.colors.textMuted} /></PressableScale>
      </View>
      {templates.length ? <ScrollView style={styles.routines} showsVerticalScrollIndicator={false}>
        {templates.slice(0, 4).map(t => <PressableScale key={t.id} accessibilityRole="button" accessibilityLabel={`Start ${t.name}`} onPress={() => start(t)} scaleTo={0.98} style={styles.routine}>
          <View style={styles.playPlate}><Play size={16} color={theme.colors.onPrimary} fill={theme.colors.onPrimary} /></View>
          <View style={styles.routineText}><Text style={styles.routineTitle} numberOfLines={1}>{t.name}</Text><Text style={styles.routineMeta}>{t.exercises.length} {t.exercises.length === 1 ? 'exercise' : 'exercises'}</Text></View>
          <ChevronRight size={20} color={theme.colors.textSubtle} />
        </PressableScale>)}
      </ScrollView> : <Text style={styles.emptyText}>Create your first routine to make quick starts effortless.</Text>}
      <View style={styles.sheetActions}>
        <Button label="Log a finished activity" variant="secondary" onPress={() => { setQuickOpen(false); onQuickLog(); }} />
        <Button label="New routine" icon={Plus} variant={templates.length ? 'ghost' : 'primary'} onPress={() => { setQuickOpen(false); onCreate(); }} />
      </View>
    </Sheet>
  </>;
};

// Bottom sheet: the scrim fades while the sheet rises; exits are faster than entrances.
export const Sheet = ({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(progress, { toValue: visible ? 1 : 0, duration: reduced ? 120 : visible ? 320 : 220, easing: theme.motion.drawer, useNativeDriver: theme.motion.nativeDriver })
      .start(({ finished }) => { if (finished && !visible) setMounted(false); });
  }, [visible, progress, reduced]);
  if (!mounted) return null;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : 480, 0] });
  return <Modal visible transparent animationType="none" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}><Pressable accessibilityLabel="Close" style={styles.scrim} onPress={onClose} /></Animated.View>
      <Animated.View style={[styles.sheet, { transform: [{ translateY }], opacity: reduced ? progress : 1 }]}>
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </KeyboardAvoidingView>
  </Modal>;
};

const NavItem = ({ view, label, Icon, currentView, navigate }: { view: ViewState; label: string; Icon: typeof CalendarDays; currentView: string; navigate: (v: ViewState) => void }) => {
  const active = currentView === view || (view === 'templates' && currentView === 'template-editor');
  return <Pressable accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: active }} onPress={() => navigate(view)} style={styles.navItem}>
    <View style={[styles.activeBar, active && styles.activeBarOn]} />
    <Icon size={22} color={active ? theme.colors.text : theme.colors.textSubtle} strokeWidth={active ? 2.4 : 1.9} />
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </Pressable>;
};

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, bottom: 0, height: Platform.OS === 'ios' ? 88 : 72, paddingBottom: Platform.OS === 'ios' ? 20 : 4, flexDirection: 'row', alignItems: 'stretch', backgroundColor: theme.colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border, zIndex: 50 },
  navItem: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 4 },
  activeBar: { position: 'absolute', top: 0, width: 28, height: 3, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  activeBarOn: { backgroundColor: theme.colors.text },
  navLabel: { ...theme.type.caption, color: theme.colors.textSubtle }, navLabelActive: { color: theme.colors.text, fontFamily: theme.type.label.fontFamily },
  quickSlot: { width: 76, alignItems: 'center', justifyContent: 'center' },
  quickButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: theme.colors.surfaceElevated },
  modalRoot: { flex: 1, justifyContent: 'flex-end' }, scrim: { flex: 1, backgroundColor: theme.colors.overlay },
  sheet: { maxHeight: '84%', backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl, paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 34 : 20, ...theme.shadow.sheet },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.surfacePressed, alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { ...theme.type.title, color: theme.colors.text },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  routines: { maxHeight: 300, marginBottom: 16 },
  routine: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border, gap: 14 },
  playPlate: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  routineText: { flex: 1 }, routineTitle: { ...theme.type.heading, color: theme.colors.text }, routineMeta: { ...theme.type.caption, color: theme.colors.textMuted, marginTop: 2 },
  emptyText: { ...theme.type.body, color: theme.colors.textMuted, marginVertical: 20 },
  sheetActions: { gap: 8 },
});
