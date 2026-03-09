import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CheckCircle, Clock, Dumbbell, BarChart2 } from 'lucide-react-native';
import { WorkoutLog } from '../../types';

interface WorkoutSummaryPageProps {
  log: WorkoutLog;
  onDone: () => void;
}

export const WorkoutSummaryPage = ({ log, onDone }: WorkoutSummaryPageProps) => {
  const durationMs = log.endTime ? log.endTime - log.startTime : 0;
  const durationMin = Math.round(durationMs / 60000);
  const completedExercises = log.exercises.filter(e => e.completed).length;
  const totalExercises = log.exercises.length;
  const totalSets = log.exercises.reduce((acc, e) => acc + e.sets.filter(s => s.completed).length, 0);
  const totalVolume = log.exercises.reduce((acc, e) =>
    acc + e.sets.reduce((sAcc, s) => sAcc + ((s.weight || 0) * (s.reps || 0)), 0), 0
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <CheckCircle size={56} color="#4ade80" style={styles.icon} />
        <Text style={styles.title}>Workout Complete!</Text>
        <Text style={styles.subtitle}>{log.templateName}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Clock size={20} color="#0ea5e9" />
          <Text style={styles.statValue}>{durationMin}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>

        <View style={styles.statCard}>
          <Dumbbell size={20} color="#a78bfa" />
          <Text style={styles.statValue}>{completedExercises}<Text style={styles.statDivider}>/{totalExercises}</Text></Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>

        <View style={styles.statCard}>
          <BarChart2 size={20} color="#f472b6" />
          <Text style={styles.statValue}>{totalSets}</Text>
          <Text style={styles.statLabel}>Sets Done</Text>
        </View>
      </View>

      {totalVolume > 0 && (
        <View style={styles.volumeCard}>
          <Text style={styles.volumeLabel}>Total Volume</Text>
          <Text style={styles.volumeValue}>{totalVolume.toLocaleString()} kg</Text>
        </View>
      )}

      <View style={styles.exerciseList}>
        <Text style={styles.sectionTitle}>Exercises</Text>
        {log.exercises.map((ex, i) => (
          <View key={i} style={styles.exerciseRow}>
            <View style={[styles.dot, ex.completed && styles.dotCompleted]} />
            <Text style={[styles.exerciseName, !ex.completed && styles.exerciseNameIncomplete]}>
              {ex.exerciseName}
            </Text>
            <Text style={styles.exerciseSets}>{ex.sets.filter(s => s.completed).length} sets</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.doneButton} onPress={onDone} activeOpacity={0.8}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { paddingBottom: 40 },
  header: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  icon: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 6 },
  subtitle: { fontSize: 16, color: '#94a3b8' },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  statDivider: { fontSize: 14, color: '#64748b' },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
  volumeCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  volumeLabel: { color: '#94a3b8', fontSize: 14 },
  volumeValue: { color: '#fbbf24', fontSize: 20, fontWeight: 'bold' },
  exerciseList: { paddingHorizontal: 20, marginBottom: 32 },
  sectionTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  dotCompleted: { backgroundColor: '#4ade80' },
  exerciseName: { flex: 1, color: 'white', fontSize: 14 },
  exerciseNameIncomplete: { color: '#64748b' },
  exerciseSets: { color: '#64748b', fontSize: 12 },
  doneButton: {
    marginHorizontal: 20,
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  doneButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
