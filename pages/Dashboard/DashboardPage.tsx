import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { Header } from '../../components/layout/Header';
import { WeeklySchedule } from './WeeklySchedule';
import { TodayFocusCard } from './TodayFocusCard';

import { WorkoutTemplate, ViewState } from '../../types';

interface DashboardPageProps {
  templates: WorkoutTemplate[];
  startWorkout: (t: WorkoutTemplate) => void;
  setView: (v: ViewState) => void;
}

export const DashboardPage = ({ templates, startWorkout, setView }: DashboardPageProps) => {
    const todayIndex = new Date().getDay();

    const todaysWorkouts = useMemo(
      () => templates.filter(t => t.scheduleDays?.includes(todayIndex)),
      [templates, todayIndex]
    );

    const handleTemplatePress = (template: WorkoutTemplate) => {
      Alert.alert(
        template.name,
        `${template.exercises.length} exercises`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit', onPress: () => setView('templates') },
          { text: 'Start', style: 'default', onPress: () => startWorkout(template) },
        ]
      );
    };

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <Header title="Dashboard" />

        <View style={styles.content}>
          <WeeklySchedule templates={templates} onStartWorkout={startWorkout} />

          <TodayFocusCard
            todaysWorkouts={todaysWorkouts}
            onStartWorkout={startWorkout}
            onBrowse={() => setView('templates')}
          />

          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Templates</Text>
              {templates.length > 3 && (
                <TouchableOpacity onPress={() => setView('templates')}>
                  <Text style={styles.viewAll}>View All →</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.listContainer}>
              {templates.slice(0, 3).map(template => (
                <TouchableOpacity
                    key={template.id}
                    onPress={() => handleTemplatePress(template)}
                    style={styles.card}
                >
                  <View>
                    <Text style={styles.cardTitle}>{template.name}</Text>
                    <Text style={styles.cardSubtitle}>{template.exercises.length} Exercises</Text>
                  </View>
                  <ChevronRight size={20} color="#475569" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  scrollContent: {
    paddingBottom: 96,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e8f0',
  },
  viewAll: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: '600',
    color: '#f1f5f9',
    fontSize: 16,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
});
