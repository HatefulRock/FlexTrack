import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { PressableScale } from '../ui/Primitives';

export const Header = ({ title, subtitle, onBack, rightAction }: { title: string; subtitle?: string; onBack?: () => void; rightAction?: ReactNode }) => (
  <View style={styles.container}>
    <View style={styles.left}>
      {onBack && <PressableScale accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} scaleTo={0.92} style={styles.back}><ChevronLeft size={26} color={theme.colors.text} /></PressableScale>}
      <View style={styles.titles}>
        <Text accessibilityRole="header" style={[styles.title, onBack && styles.titleInline]} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
    </View>
    <View style={styles.right}>{rightAction}</View>
  </View>
);

const styles = StyleSheet.create({
  container: { minHeight: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: theme.colors.canvas },
  left: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  titles: { flex: 1 },
  title: { ...theme.type.display, color: theme.colors.text },
  titleInline: { ...theme.type.title },
  subtitle: { ...theme.type.body, color: theme.colors.textMuted, marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
