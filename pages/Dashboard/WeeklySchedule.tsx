import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { WorkoutTemplate } from '../../types';
import { getShortDayName } from '../../utils/formatters';

interface WeeklyScheduleProps {
  templates: WorkoutTemplate[];
  onStartWorkout: (t: WorkoutTemplate) => void;
}

export const WeeklySchedule = ({ templates, onStartWorkout }: WeeklyScheduleProps) => {
  const todayIndex = new Date().getDay();
  const days = [0, 1, 2, 3, 4, 5, 6];
  
  const weeklySchedule = days.map(d => ({
    day: d,
    workouts: templates.filter(t => t.scheduleDays?.includes(d))
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Schedule</Text>
      
      <ScrollView 
        horizontal={true} 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {weeklySchedule.map((slot) => {
          const isToday = slot.day === todayIndex;
          const hasWorkout = slot.workouts.length > 0;
          
          return (
            <TouchableOpacity 
              key={slot.day}
              onPress={() => { if (hasWorkout) onStartWorkout(slot.workouts[0]); }}
              activeOpacity={hasWorkout ? 0.7 : 1}
              style={[
                styles.card,
                isToday ? styles.cardToday : styles.cardDefault,
                (hasWorkout && !isToday) ? styles.cardHasWorkout : null
              ]}
            >
              <Text style={[styles.dayText, isToday && styles.textWhite]}>
                {getShortDayName(slot.day)}
              </Text>

              <View style={styles.indicatorContainer}>
                {hasWorkout ? (
                    <View style={[
                        styles.dot, 
                        isToday ? styles.dotWhite : styles.dotPrimary
                    ]} />
                ) : (
                    <Text style={styles.dash}>-</Text>
                )}
              </View>

              {/* "Active" Badge (Replaces animate-ping) */}
              {isToday && (
                  <View style={styles.activeBadgeWrapper}>
                      <View style={styles.activeBadgeInner} />
                  </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8, // space-y-2
  },
  title: {
    color: '#94a3b8', // text-slate-400
    fontSize: 12, // text-xs
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1, // tracking-wider
    marginLeft: 4,
  },
  scrollContent: {
    paddingBottom: 8, // pb-2
    paddingRight: 16, // Add some padding at the end of scroll
  },
  card: {
    width: 64, // w-16
    height: 80, // h-20
    borderRadius: 12, // rounded-xl
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 8, // gap-2 substitute
  },
  cardDefault: {
    backgroundColor: '#1e293b', // bg-surface
    borderColor: '#334155', // border-slate-700
  },
  cardToday: {
    backgroundColor: '#0ea5e9', // bg-primary
    borderColor: '#0ea5e9',
    // Shadow for active day
    shadowColor: '#0c4a6e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHasWorkout: {
    borderColor: '#38bdf8', // border-primary/50
  },
  dayText: {
    fontSize: 12, // text-xs
    fontWeight: 'bold',
    color: '#94a3b8', // text-slate-400
  },
  textWhite: {
    color: 'white',
  },
  indicatorContainer: {
    marginTop: 8, // mt-2
  },
  dot: {
    width: 8, // w-2
    height: 8, // h-2
    borderRadius: 4, // rounded-full
  },
  dotWhite: {
    backgroundColor: 'white',
  },
  dotPrimary: {
    backgroundColor: '#0ea5e9', // bg-primary
  },
  dash: {
    fontSize: 12,
    opacity: 0.2,
    color: '#94a3b8',
  },
  
  // Badge Styles (Top Right Corner)
  activeBadgeWrapper: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBadgeInner: {
    width: 10,
    height: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#0ea5e9', // Match bg to hide border visual
  }
});