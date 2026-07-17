import React, { ReactNode } from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { theme } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export const Button = ({ label, onPress, icon: Icon, variant = 'primary', disabled, loading, style }: {
  label: string; onPress: () => void; icon?: LucideIcon; variant?: ButtonVariant; disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>;
}) => (
  <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={disabled || loading} onPress={onPress}
    activeOpacity={0.76} style={[styles.button, styles[`button_${variant}`], (disabled || loading) && styles.disabled, style]}>
    {loading ? <ActivityIndicator color={variant === 'primary' ? theme.colors.canvas : theme.colors.text} /> : <>
      {Icon && <Icon size={18} color={variant === 'primary' ? theme.colors.canvas : variant === 'danger' ? theme.colors.danger : theme.colors.text} strokeWidth={2.4} />}
      <Text style={[styles.buttonLabel, variant === 'primary' && styles.buttonLabelPrimary, variant === 'danger' && styles.buttonLabelDanger]}>{label}</Text>
    </>}
  </TouchableOpacity>
);

export const Card = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[styles.card, style]}>{children}</View>;

export const SectionHeader = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
  <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>
    {action && onAction && <TouchableOpacity accessibilityRole="button" onPress={onAction} style={styles.sectionAction}><Text style={styles.sectionActionText}>{action}</Text></TouchableOpacity>}
  </View>
);

export const Chip = ({ label, active = false, onPress }: { label: string; active?: boolean; onPress?: () => void }) => {
  const content = <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>;
  return onPress ? <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.chip, active && styles.chipActive]}>{content}</TouchableOpacity>
    : <View style={[styles.chip, active && styles.chipActive]}>{content}</View>;
};

export const EmptyState = ({ icon: Icon, title, message, action, onAction }: { icon: LucideIcon; title: string; message: string; action?: string; onAction?: () => void }) => (
  <View style={styles.empty}><View style={styles.emptyIcon}><Icon size={28} color={theme.colors.primary} /></View>
    <Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyMessage}>{message}</Text>
    {action && onAction && <Button label={action} onPress={onAction} />}
  </View>
);

const styles = StyleSheet.create({
  button: { minHeight: 50, paddingHorizontal: 18, borderRadius: theme.radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderWidth: 1 },
  button_primary: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, ...theme.shadow.glow },
  button_secondary: { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.borderStrong },
  button_ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  button_danger: { backgroundColor: theme.colors.dangerSoft, borderColor: 'rgba(251,113,133,0.25)' },
  buttonLabel: { ...theme.type.label, color: theme.colors.text }, buttonLabelPrimary: { color: theme.colors.canvas }, buttonLabelDanger: { color: theme.colors.danger }, disabled: { opacity: 0.45 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: theme.spacing.lg, ...theme.shadow.card },
  sectionHeader: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  sectionTitle: { ...theme.type.heading, color: theme.colors.text }, sectionAction: { minHeight: 40, justifyContent: 'center', paddingLeft: theme.spacing.lg }, sectionActionText: { ...theme.type.label, color: theme.colors.primary },
  chip: { minHeight: 36, borderRadius: theme.radius.pill, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary }, chipLabel: { ...theme.type.caption, color: theme.colors.textMuted }, chipLabelActive: { color: theme.colors.primary },
  empty: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 48 }, emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { ...theme.type.heading, color: theme.colors.text, marginBottom: 8 }, emptyMessage: { ...theme.type.body, color: theme.colors.textMuted, textAlign: 'center', marginBottom: 24, maxWidth: 320 },
});

