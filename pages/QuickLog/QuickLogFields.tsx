import React, { ReactNode } from 'react';
import { KeyboardTypeOptions, Platform, StyleProp, StyleSheet, Text, TextInput, TextStyle, View, ViewStyle } from 'react-native';
import { PressableScale } from '../../components/ui/Primitives';
import { theme } from '../../constants/theme';

const c = theme.colors;
// Dates, times and durations need ":" or "-", which number-pad lacks on iOS and Android.
export const punctuatedNumbers: KeyboardTypeOptions = Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default';

export const FieldBlock = ({ label, hint, error, children, style }: { label: string; hint?: string; error?: string; children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.block, style]}>
    <Text style={styles.label}>{label}</Text>
    {children}
    {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>
      : hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>
);

export const Input = ({ label, value, onChange, placeholder, keyboard = 'default', multiline = false, invalid = false, style, maxLength }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; keyboard?: KeyboardTypeOptions; multiline?: boolean; invalid?: boolean; style?: StyleProp<TextStyle>; maxLength?: number;
}) => <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={c.textMuted}
  keyboardType={keyboard} multiline={multiline} maxLength={maxLength} selectionColor={c.primary} cursorColor={c.primary}
  style={[styles.input, multiline && styles.multiline, invalid && styles.invalid, style]} />;

// Equal-width segments: one row of a fixed grid, never wrapping pills.
export function Segments<T extends string>({ options, value, onChange, columns, label, height = 48 }: {
  options: { key: T; label: string }[]; value: T | null; onChange: (v: T) => void; columns: number; label: string; height?: number;
}) {
  return <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.grid}>
    {options.map(o => {
      const active = o.key === value;
      return <View key={o.key} style={[styles.segment, { width: `${100 / columns}%` as const }]}>
        <PressableScale accessibilityRole="radio" accessibilityLabel={o.label} accessibilityState={{ selected: active, checked: active }}
          onPress={() => onChange(o.key)} scaleTo={0.96} style={[styles.segmentFill, { minHeight: height }, active && styles.segmentActive]}>
          <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{o.label}</Text>
        </PressableScale>
      </View>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  label: { ...theme.type.label, color: c.textSecondary },
  hint: { ...theme.type.caption, color: c.textMuted },
  error: { ...theme.type.caption, fontFamily: theme.type.label.fontFamily, color: c.danger },
  input: { minHeight: 48, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: c.borderStrong, backgroundColor: c.surface, color: c.text, paddingHorizontal: 12, fontFamily: theme.type.body.fontFamily, fontSize: 16 },
  multiline: { minHeight: 96, paddingTop: 12, paddingBottom: 12, textAlignVertical: 'top' },
  invalid: { borderColor: c.danger },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, rowGap: 8 },
  segment: { paddingHorizontal: 4 },
  segmentFill: { borderRadius: theme.radius.sm, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segmentActive: { backgroundColor: c.primary },
  segmentText: { ...theme.type.label, color: c.textSecondary },
  segmentTextActive: { color: c.onPrimary },
});
