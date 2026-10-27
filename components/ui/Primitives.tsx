import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Pressable, PressableProps, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { theme } from '../../constants/theme';

export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then(v => { if (alive) setReduced(!!v); }).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', v => setReduced(!!v));
    return () => { alive = false; sub?.remove?.(); };
  }, []);
  return reduced;
};

// Press feedback for every touchable: a small scale, never an opacity strobe.
// The Pressable itself is animated so layout styles (flex, margins) and the hit area stay on one element.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export const PressableScale = ({ scaleTo = 0.97, style, children, disabled, ...rest }: Omit<PressableProps, 'style'> & { scaleTo?: number; style?: StyleProp<ViewStyle>; children?: ReactNode }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();
  const to = (value: number, duration: number) => Animated.timing(scale, { toValue: value, duration, easing: theme.motion.easeOut, useNativeDriver: theme.motion.nativeDriver }).start();
  return <AnimatedPressable {...rest} disabled={disabled} style={[style, { transform: [{ scale }] }]}
    onPressIn={e => { if (!reduced) to(scaleTo, 100); rest.onPressIn?.(e); }}
    onPressOut={e => { if (!reduced) to(1, 160); rest.onPressOut?.(e); }}>
    {children}
  </AnimatedPressable>;
};

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export const Button = ({ label, onPress, icon: Icon, variant = 'primary', disabled, loading, style, accessibilityLabel }: {
  label: string; onPress: () => void; icon?: LucideIcon; variant?: ButtonVariant; disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>; accessibilityLabel?: string;
}) => {
  const fg = variant === 'primary' ? theme.colors.onPrimary : variant === 'danger' ? theme.colors.danger : theme.colors.text;
  return <PressableScale accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled: !!(disabled || loading) }}
    disabled={disabled || loading} onPress={onPress}
    style={[styles.button, styles[`button_${variant}`], (disabled || loading) && styles.disabled, style]}>
    {loading ? <ActivityIndicator color={fg} /> : <>
      {Icon && <Icon size={18} color={fg} strokeWidth={2.4} />}
      <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
    </>}
  </PressableScale>;
};

export const Card = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[styles.card, style]}>{children}</View>;

export const SectionHeader = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
  <View style={styles.sectionHeader}><Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
    {action && onAction && <PressableScale accessibilityRole="button" onPress={onAction} style={styles.sectionAction}><Text style={styles.sectionActionText}>{action}</Text></PressableScale>}
  </View>
);

export const Chip = ({ label, active = false, onPress, accessibilityLabel }: { label: string; active?: boolean; onPress?: () => void; accessibilityLabel?: string }) => {
  const content = <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>;
  return onPress ? <PressableScale accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected: active }} onPress={onPress} scaleTo={0.95} style={[styles.chip, active && styles.chipActive]}>{content}</PressableScale>
    : <View style={[styles.chip, active && styles.chipActive]}>{content}</View>;
};

export const EmptyState = ({ icon: Icon, title, message, action, onAction }: { icon: LucideIcon; title: string; message: string; action?: string; onAction?: () => void }) => (
  <View style={styles.empty}><Icon size={32} color={theme.colors.textMuted} strokeWidth={1.75} />
    <Text accessibilityRole="header" style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyMessage}>{message}</Text>
    {action && onAction && <Button label={action} onPress={onAction} style={styles.emptyAction} />}
  </View>
);

const styles = StyleSheet.create({
  button: { minHeight: 52, paddingHorizontal: 20, borderRadius: theme.radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  button_primary: { backgroundColor: theme.colors.primary },
  button_secondary: { backgroundColor: theme.colors.surfaceElevated },
  button_ghost: { backgroundColor: 'transparent' },
  button_danger: { backgroundColor: theme.colors.dangerSoft },
  buttonLabel: { ...theme.type.button }, disabled: { opacity: 0.4 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: theme.spacing.lg },
  sectionHeader: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm },
  sectionTitle: { ...theme.type.title, fontSize: 24, lineHeight: 28, color: theme.colors.text },
  sectionAction: { minHeight: 44, justifyContent: 'center', paddingLeft: theme.spacing.lg }, sectionActionText: { ...theme.type.label, color: theme.colors.textSecondary, textDecorationLine: 'underline' },
  chip: { minHeight: 44, borderRadius: theme.radius.sm, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface },
  chipActive: { backgroundColor: theme.colors.primary }, chipLabel: { ...theme.type.label, color: theme.colors.textSecondary }, chipLabelActive: { color: theme.colors.onPrimary },
  empty: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 48, gap: 10 },
  emptyTitle: { ...theme.type.title, fontSize: 26, lineHeight: 30, color: theme.colors.text, textAlign: 'center' },
  emptyMessage: { ...theme.type.body, color: theme.colors.textMuted, textAlign: 'center', maxWidth: 320 },
  emptyAction: { marginTop: 14, alignSelf: 'stretch' },
});
