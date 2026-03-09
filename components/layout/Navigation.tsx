import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';
import { Calendar, Dumbbell, Sparkles, History, Activity } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ViewState } from '../../types';

interface NavigationProps {
  currentView: ViewState | 'template-editor';
  setView: (v: ViewState) => void;
}

interface NavItemProps {
  view: ViewState;
  icon: any;
  label: string;
  currentView: ViewState | 'template-editor';
  setView: (v: ViewState) => void;
}

const NavItem = ({ view, icon: Icon, label, currentView, setView }: NavItemProps) => {
  const isActive = currentView === view || (view === 'templates' && currentView === 'template-editor');
  const color = isActive ? '#0ea5e9' : '#94a3b8';

  const handlePress = () => {
    Haptics.selectionAsync();
    setView(view);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.navItem}
      activeOpacity={0.7}
    >
      <Icon size={24} color={color} />
      <Text style={[styles.navText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export const Navigation = ({ currentView, setView }: NavigationProps) => {
  const handleFabPress = () => {
    Haptics.selectionAsync();
    setView('ai-creator');
  };

  return (
    <View style={styles.container}>
      <NavItem view="dashboard" icon={Calendar} label="Schedule" currentView={currentView} setView={setView} />
      <NavItem view="templates" icon={Dumbbell} label="Workouts" currentView={currentView} setView={setView} />

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          onPress={handleFabPress}
          style={styles.fab}
          activeOpacity={0.8}
        >
          <Sparkles size={28} color="white" />
        </TouchableOpacity>
      </View>

      <NavItem view="history" icon={History} label="History" currentView={currentView} setView={setView} />
      <NavItem view="stats" icon={Activity} label="Stats" currentView={currentView} setView={setView} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 80,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    elevation: 20,
    zIndex: 50,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    flex: 1,
  },
  navText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  fabContainer: {
    position: 'relative',
    top: -25,
    width: 60,
    alignItems: 'center',
    zIndex: 60,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0c4a6e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  }
});
