import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Exercise } from '../../types';
import { History } from 'lucide-react-native';

interface ExerciseViewProps {
  exercise: Exercise;
  index: number;
  total: number;
}

export const ExerciseView = ({ exercise, index, total }: ExerciseViewProps) => {
  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <View style={{flex: 1}}>
                <Text style={styles.title}>{exercise.name}</Text>
                <Text style={styles.counter}>Exercise {index + 1} of {total}</Text>
            </View>
            <TouchableOpacity 
                style={styles.historyBtn} 
                onPress={() => Alert.alert("History", "Future feature: Show graph of progress")}
            >
                <History size={20} color="#94a3b8" />
            </TouchableOpacity>
        </View>

        {exercise.notes && (
            <View style={styles.notesContainer}>
                <Text style={styles.notesText}>{exercise.notes}</Text>
            </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginRight: 8 },
  counter: { fontSize: 12, color: '#38bdf8', marginTop: 4 },
  historyBtn: { padding: 8, backgroundColor: '#1e293b', borderRadius: 8 },
  notesContainer: { backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b' },
  notesText: { color: '#94a3b8', fontSize: 14 },
});