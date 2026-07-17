import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { theme } from '../../constants/theme';

export const Header = ({ title, eyebrow, onBack, rightAction }: { title: string; eyebrow?: string; onBack?: () => void; rightAction?: ReactNode }) => (
  <View style={styles.container}>
    <View style={styles.left}>
      {onBack && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.back}><ChevronLeft size={24} color={theme.colors.text} /></TouchableOpacity>}
      <View><Text style={styles.eyebrow}>{eyebrow || 'FLEXTRACK'}</Text><Text style={styles.title}>{title}</Text></View>
    </View>
    <View style={styles.right}>{rightAction}</View>
  </View>
);

const styles = StyleSheet.create({
  container: { minHeight: 72, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: theme.colors.canvas },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 }, back: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  eyebrow: { ...theme.type.caption, color: theme.colors.primary, letterSpacing: 1.6, fontSize: 10 }, title: { ...theme.type.title, color: theme.colors.text },
  right: { flexDirection: 'row', alignItems: 'center' },
});

