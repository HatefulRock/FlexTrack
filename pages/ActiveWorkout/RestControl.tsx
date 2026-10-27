import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatTime } from '../../utils/time';
import { fonts, theme } from '../../constants/theme';
import { Button, PressableScale, useReducedMotion } from '../../components/ui/Primitives';
import { Barbell } from './Barbell';

export interface RestNext { title: string; load: string; barWeight?: number }
interface RestProps { restTimer: number; restEndsAt: number | null; restTotal: number; next: RestNext | null; onAdd: () => void; onSubtract: () => void; onSkip: () => void }

// Rest digits: in the last three seconds each tick pulses once so the end is felt from across the room.
const RestDigits = ({ seconds, style }: { seconds: number; style: StyleProp<TextStyle> }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || seconds > 3 || seconds <= 0) return;
    const pulse = Animated.sequence([
      Animated.timing(scale, { toValue: 1.06, duration: 90, easing: theme.motion.easeOut, useNativeDriver: theme.motion.nativeDriver }),
      Animated.timing(scale, { toValue: 1, duration: 90, easing: theme.motion.easeOut, useNativeDriver: theme.motion.nativeDriver }),
    ]);
    pulse.start();
    return () => pulse.stop();
  }, [seconds, reduced, scale]);
  return <Animated.Text accessibilityRole="timer" accessibilityLabel={`${seconds} seconds of rest left`} style={[style, { transform: [{ scale }] }]}>{formatTime(seconds)}</Animated.Text>;
};

// Drain bar: a left-anchored fill that slides out linearly until the rest ends. translateX keeps it on the native driver everywhere.
const Drain = ({ endsAt, total, style }: { endsAt: number | null; total: number; style?: StyleProp<ViewStyle> }) => {
  const [width, setWidth] = useState(0);
  const [wake, setWake] = useState(0);
  const value = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => { if (s === 'active') setWake(w => w + 1); });
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!endsAt || !width || total <= 0) return;
    const remaining = Math.max(0, endsAt - Date.now());
    value.setValue(Math.min(1, remaining / (total * 1000)));
    const anim = Animated.timing(value, { toValue: 0, duration: remaining, easing: Easing.linear, useNativeDriver: theme.motion.nativeDriver });
    anim.start();
    return () => anim.stop();
  }, [endsAt, total, width, wake, value]);
  return <View onLayout={e => setWidth(e.nativeEvent.layout.width)} style={[styles.drainTrack, style]}>
    <Animated.View style={[styles.drainFill, { transform: [{ translateX: value.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }] }]} />
  </View>;
};

const DockButton = ({ label, accessibilityLabel, onPress, wide = false }: { label: string; accessibilityLabel: string; onPress: () => void; wide?: boolean }) => (
  <PressableScale scaleTo={0.92} accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={[styles.dockBtn, wide && styles.dockSkip]}>
    <Text style={styles.dockBtnText}>{label}</Text>
  </PressableScale>
);

// Docked above the footer: never covers Next/Finish.
export const RestDock = ({ visible, onExpand, ...props }: RestProps & { visible: boolean; onExpand: () => void }) => {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const last = useRef(props);
  if (visible) last.current = props;
  const p = visible ? props : last.current;

  useEffect(() => {
    if (visible) setMounted(true);
    const a = Animated.timing(anim, { toValue: visible ? 1 : 0, duration: visible ? 240 : 200, easing: theme.motion.easeOut, useNativeDriver: theme.motion.nativeDriver });
    a.start(({ finished }) => { if (finished && !visible) setMounted(false); });
    return () => a.stop();
  }, [visible, anim]);

  if (!mounted) return null;
  const translateY = reduced ? 0 : anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  return <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[styles.dock, { opacity: anim, transform: [{ translateY }] }]}>
    <Drain endsAt={p.restEndsAt} total={p.restTotal} style={styles.dockDrain} />
    <View style={styles.dockRow}>
      <View style={styles.flex}>
        <PressableScale scaleTo={0.98} accessibilityRole="button" accessibilityLabel="Expand rest timer" accessibilityHint="Shows the countdown full screen" onPress={onExpand} style={styles.dockMain}>
          <RestDigits seconds={p.restTimer} style={styles.dockTime} />
          <View style={styles.dockNext}>
            {p.next ? <>
              <Text numberOfLines={1} style={styles.dockNextTitle}>Next: {p.next.title}</Text>
              <Text numberOfLines={1} style={styles.dockNextLoad}>{p.next.load}</Text>
            </> : <Text numberOfLines={1} style={styles.dockNextTitle}>Resting</Text>}
          </View>
          <ChevronUp size={18} color={theme.colors.textMuted} />
        </PressableScale>
      </View>
      <DockButton label="−15" accessibilityLabel="Remove 15 seconds of rest" onPress={props.onSubtract} />
      <DockButton label="+15" accessibilityLabel="Add 15 seconds of rest" onPress={props.onAdd} />
      <DockButton label="Skip" accessibilityLabel="Skip rest" onPress={props.onSkip} wide />
    </View>
  </Animated.View>;
};

// Full-screen rest: the countdown, what comes next and how to load it, controls in the thumb zone.
export const RestOverlay = ({ onMinimise, ...props }: RestProps & { onMinimise: () => void }) => {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(fade, { toValue: 1, duration: 200, easing: theme.motion.easeOut, useNativeDriver: theme.motion.nativeDriver });
    anim.start();
    return () => anim.stop();
  }, [fade]);
  return <Animated.View accessibilityViewIsModal style={[styles.overlay, { opacity: fade }]}>
    <View style={styles.overlayTop}>
      <Text accessibilityRole="header" style={styles.overlayLabel}>Rest</Text>
      <PressableScale scaleTo={0.92} accessibilityRole="button" accessibilityLabel="Minimize rest timer" onPress={onMinimise} style={styles.minimise}>
        <ChevronDown size={24} color={theme.colors.text} />
      </PressableScale>
    </View>
    <View style={styles.overlayCenter}>
      <RestDigits seconds={props.restTimer} style={styles.bigTime} />
      <Drain endsAt={props.restEndsAt} total={props.restTotal} style={styles.bigDrain} />
      {props.next && <View style={styles.overlayNext}>
        <Text style={styles.overlayNextTitle}>Next: {props.next.title}</Text>
        <Text style={styles.overlayNextLoad}>{props.next.load}</Text>
        {props.next.barWeight !== undefined && <View style={styles.overlayBar}><Barbell weight={props.next.barWeight} height={104} /></View>}
      </View>}
    </View>
    <SafeAreaView edges={['bottom']} style={styles.overlayControls}>
      <View style={styles.adjustRow}>
        <View style={styles.flex}><Button variant="secondary" label="−15 s" accessibilityLabel="Remove 15 seconds of rest" onPress={props.onSubtract} style={styles.adjust} /></View>
        <View style={styles.flex}><Button variant="secondary" label="+15 s" accessibilityLabel="Add 15 seconds of rest" onPress={props.onAdd} style={styles.adjust} /></View>
      </View>
      <Button label="Skip rest" onPress={props.onSkip} style={styles.skip} />
    </SafeAreaView>
  </Animated.View>;
};

const styles = StyleSheet.create({
  drainTrack: { height: 4, overflow: 'hidden', backgroundColor: theme.colors.surfaceElevated },
  drainFill: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.primary },
  dock: { backgroundColor: theme.colors.surface },
  dockDrain: { height: 3 },
  dockRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 16, paddingRight: 12, paddingVertical: 8 },
  dockMain: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 4 },
  dockTime: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, color: theme.colors.text, fontVariant: ['tabular-nums'], minWidth: 68 },
  dockNext: { flex: 1, minWidth: 0 },
  dockNextTitle: { ...theme.type.label, color: theme.colors.text },
  dockNextLoad: { ...theme.type.body, fontSize: 14, lineHeight: 18, color: theme.colors.textMuted, fontVariant: ['tabular-nums'] },
  dockBtn: { minWidth: 48, height: 48, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  dockSkip: { minWidth: 56 },
  dockBtnText: { ...theme.type.label, color: theme.colors.text, fontVariant: ['tabular-nums'] },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.canvas, zIndex: 200, paddingHorizontal: 16 },
  overlayTop: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overlayLabel: { ...theme.type.heading, color: theme.colors.textMuted },
  minimise: { width: 48, height: 48, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  overlayCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bigTime: { ...theme.type.timer, fontVariant: ['tabular-nums'], fontSize: 128, lineHeight: 128, letterSpacing: -1, color: theme.colors.text },
  bigDrain: { alignSelf: 'stretch', marginHorizontal: 24, marginTop: 16, borderRadius: 2 },
  overlayNext: { alignSelf: 'stretch', alignItems: 'center', marginTop: 36 },
  overlayNextTitle: { ...theme.type.heading, color: theme.colors.textSecondary, textAlign: 'center' },
  overlayNextLoad: { ...theme.type.display, color: theme.colors.text, marginTop: 4, fontVariant: ['tabular-nums'] },
  overlayBar: { alignSelf: 'stretch', marginTop: 20 },
  overlayControls: { gap: 10, paddingBottom: 16 },
  adjustRow: { flexDirection: 'row', gap: 10 },
  adjust: { minHeight: 56 },
  flex: { flex: 1 },
  skip: { minHeight: 56 },
});
