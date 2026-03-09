import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { formatTime } from '../../utils/time';
import { Maximize2, Minimize2, X, Plus, Minus } from 'lucide-react-native';

interface RestControlProps {
  restTimer: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onAdd: () => void;
  onSubtract: () => void;
  onSkip: () => void;
}

export const RestControl = ({ 
    restTimer, expanded, onToggleExpand, onAdd, onSubtract, onSkip 
}: RestControlProps) => {

  if (!expanded) {
    // MINIMIZED VIEW (Bottom Bar)
    return (
        <View style={styles.miniContainer}>
            <TouchableOpacity onPress={onToggleExpand} style={styles.miniContent}>
                <View>
                    <Text style={styles.miniLabel}>Rest</Text>
                    <Text style={styles.miniTimer}>{formatTime(restTimer)}</Text>
                </View>
                <Maximize2 size={20} color="#94a3b8" />
            </TouchableOpacity>
            
            <View style={styles.miniControls}>
                <TouchableOpacity onPress={onAdd} style={styles.miniBtn}>
                    <Text style={styles.miniBtnText}>+30</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onSkip} style={styles.miniBtnSkip}>
                    <Text style={styles.miniBtnTextWhite}>Skip</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
  }

  // EXPANDED VIEW (Full Screen Overlay)
  return (
    <View style={styles.overlay}>
        <TouchableOpacity onPress={onToggleExpand} style={styles.closeBtn}>
            <Minimize2 size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.label}>Resting</Text>
        <Text style={styles.timer}>{formatTime(restTimer)}</Text>
        
        <View style={styles.controlsRow}>
            <TouchableOpacity onPress={onSubtract} style={styles.circleBtn}>
                <Minus size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onAdd} style={styles.circleBtn}>
                <Plus size={24} color="white" />
            </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
            <Text style={styles.skipBtnText}>Skip Rest</Text>
        </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Minimized Styles
  miniContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155',
    flexDirection: 'row', alignItems: 'center', padding: 12, justifyContent: 'space-between',
    elevation: 10, zIndex: 100
  },
  miniContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  miniLabel: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' },
  miniTimer: { fontSize: 24, fontWeight: 'bold', color: '#38bdf8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  miniControls: { flexDirection: 'row', gap: 8 },
  miniBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  miniBtnSkip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#ef4444', borderRadius: 8 },
  miniBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  miniBtnTextWhite: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  // Expanded Styles
  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center', zIndex: 200, elevation: 200,
  },
  closeBtn: { position: 'absolute', top: 48, right: 24, padding: 8 },
  label: { color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 4, fontSize: 14, fontWeight: 'bold' },
  timer: { fontSize: 80, fontWeight: '900', color: 'white', marginBottom: 32, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  controlsRow: { flexDirection: 'row', gap: 32, marginBottom: 48 },
  circleBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#475569', justifyContent: 'center', alignItems: 'center' },
  skipBtn: { backgroundColor: '#38bdf8', paddingHorizontal: 48, paddingVertical: 16, borderRadius: 999 },
  skipBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});