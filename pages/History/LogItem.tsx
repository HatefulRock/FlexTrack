import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutLog } from '../../types';
import { formatTime } from '../../utils/time';

export const LogItem = ({ log }: { log: WorkoutLog }) => {
  // Safe calculation for volume (handling potential missing data)
  const totalVolume = log.exercises?.reduce((acc, ex) => {
    const exVol = ex.sets?.reduce((sAcc, s) => sAcc + ((s.weight || 0) * (s.reps || 0)), 0) || 0;
    return acc + exVol;
  }, 0) || 0;

  return (
    <View style={styles.card}>
        <View style={styles.header}>
            {/* Added titleContainer to handle text wrapping properly */}
            <View style={styles.titleContainer}>
                 <Text style={styles.title} numberOfLines={1}>{log.templateName}</Text>
                 <Text style={styles.date}>{new Date(log.startTime).toLocaleDateString()}</Text>
            </View>
            
            {/* Volume Badge */}
            {totalVolume > 0 && (
                <View style={styles.volumeBadge}>
                     <Text style={styles.volumeText}>{totalVolume} kg</Text>
                </View>
            )}
        </View>
        
        <Text style={styles.details}>
            {log.endTime && formatTime(Math.floor((log.endTime - log.startTime) / 1000))} duration • {log.exercises.filter(e => e.completed).length} exercises
        </Text>
        
        <View style={styles.tagsContainer}>
            {log.exercises.slice(0, 3).map((e, i) => (
                <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{e.exerciseName}</Text>
                </View>
            ))}
            
            {log.exercises.length > 3 && (
                <Text style={styles.moreText}>+{log.exercises.length - 3} more</Text>
            )}
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b', 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1,
    borderColor: '#334155', 
  },
  header: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 8, 
  },
  titleContainer: {
    flex: 1, // Takes available space
    marginRight: 12, // Spacing between text and badge
  },
  title: {
    fontWeight: 'bold', 
    color: 'white', 
    fontSize: 16, 
  },
  date: {
    fontSize: 12, 
    color: '#64748b', 
    marginTop: 2,
  },
  // --- ADDED MISSING STYLES BELOW ---
  volumeBadge: {
    backgroundColor: '#0f172a', // Darker background for contrast
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  volumeText: {
    color: '#fbbf24', // Amber/Gold color
    fontSize: 12,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  // ----------------------------------
  details: {
    fontSize: 12, 
    color: '#94a3b8', 
    marginBottom: 12, // Increased slightly for spacing
  },
  tagsContainer: {
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6, 
    alignItems: 'center',
  },
  tag: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 4, 
    borderWidth: 1,
    borderColor: '#334155', 
  },
  tagText: {
    fontSize: 10, 
    color: '#cbd5e1', 
  },
  moreText: {
    fontSize: 10, 
    color: '#64748b', 
    paddingHorizontal: 4, 
  },
});