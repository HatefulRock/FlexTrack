import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

interface HeaderProps {
  title: string;
  rightAction?: React.ReactNode;
  onBack?: () => void;
}

export const Header = ({ title, rightAction, onBack }: HeaderProps) => (
  <View style={styles.container}>
    <View style={styles.leftContainer}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={28} color="#94a3b8" /> {/* text-slate-400 */}
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{title}</Text>
    </View>
    
    <View style={styles.rightContainer}>
        {rightAction}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    height: 60, // h-16 approx
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, // p-4
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b', // border-slate-800
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // bg-background/90
    zIndex: 40, // z-40
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // gap-3
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20, // text-xl
    fontWeight: 'bold', // font-bold
    color: 'white', // text-white
    letterSpacing: -0.5, // tracking-tight
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});