import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Header } from '../../components/layout/Header';
import { LogItem } from './LogItem';
import { WorkoutLog } from '../../types';
import { format, subDays, isSameDay } from 'date-fns';

// --- COMPONENT: ACTIVITY HEATMAP (28 days, 4 rows × 7 cols) ---
const ActivityHeatmap = ({ logs }: { logs: WorkoutLog[] }) => {
    const days = Array.from({ length: 28 }).map((_, i) => {
        const date = subDays(new Date(), 27 - i);
        const hasWorkout = logs.some(l => isSameDay(new Date(l.startTime), date));
        return { date, hasWorkout };
    });

    const weeks = [days.slice(0, 7), days.slice(7, 14), days.slice(14, 21), days.slice(21, 28)];

    return (
        <View style={styles.heatmapContainer}>
            {weeks.map((week, wi) => (
                <View key={wi} style={styles.heatmapGrid}>
                    {week.map((day, i) => (
                        <View key={i} style={styles.heatmapDayColumn}>
                            <View
                                style={[
                                    styles.heatmapDot,
                                    day.hasWorkout && styles.heatmapDotActive
                                ]}
                            />
                            <Text style={styles.heatmapLabel}>{format(day.date, 'dd')}</Text>
                            <Text style={styles.heatmapSubLabel}>{format(day.date, 'EEEEE')}</Text>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
};

export const HistoryPage = ({ logs }: { logs: WorkoutLog[] }) => {
    const [filter, setFilter] = useState('All');

    const { totalWorkouts, avgDuration } = useMemo(() => {
        const total = logs.length;
        const dur = logs.reduce((acc, log) => acc + (log.endTime ? log.endTime - log.startTime : 0), 0);
        return {
            totalWorkouts: total,
            avgDuration: total > 0 ? Math.round(dur / total / 60 / 1000) : 0,
        };
    }, [logs]);

    const filterOptions = useMemo(
        () => ['All', ...Array.from(new Set(logs.map(l => l.templateName)))],
        [logs]
    );

    const streak = useMemo(() => {
        let count = 0;
        let day = new Date();
        while (logs.some(l => isSameDay(new Date(l.startTime), day))) {
            count++;
            day = subDays(day, 1);
        }
        return count;
    }, [logs]);

    const filteredLogs = useMemo(() => {
        if (filter === 'All') return logs;
        return logs.filter(l => l.templateName === filter);
    }, [logs, filter]);

    const groupedLogs = useMemo(() => {
        const groups: { [key: string]: WorkoutLog[] } = {};
        filteredLogs.forEach(log => {
            const monthKey = format(new Date(log.startTime), 'MMMM yyyy');
            if (!groups[monthKey]) groups[monthKey] = [];
            groups[monthKey].push(log);
        });
        return groups;
    }, [filteredLogs]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Header title="History" />

            <View style={styles.content}>
                <ActivityHeatmap logs={logs} />

                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{totalWorkouts}</Text>
                        <Text style={styles.statLabel}>Workouts</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{avgDuration}<Text style={styles.statUnit}>m</Text></Text>
                        <Text style={styles.statLabel}>Avg Time</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{streak}<Text style={styles.statUnit}> 🔥</Text></Text>
                        <Text style={styles.statLabel}>Streak</Text>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {filterOptions.map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.chip, filter === t && styles.chipActive]}
                            onPress={() => setFilter(t)}
                        >
                            <Text style={[styles.chipText, filter === t && styles.chipTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {Object.keys(groupedLogs).length === 0 ? (
                     <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No logs found.</Text>
                     </View>
                ) : (
                    Object.entries(groupedLogs).reverse().map(([month, monthLogs]) => (
                        <View key={month}>
                            <Text style={styles.monthHeader}>{month}</Text>
                            <View style={styles.listContainer}>
                                {monthLogs.slice().reverse().map(log => (
                                    <LogItem key={log.id} log={log} />
                                ))}
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  scrollContent: { paddingBottom: 96 },
  content: { padding: 16, gap: 20 },

  // Heatmap Styles
  heatmapContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  heatmapGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heatmapDayColumn: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  heatmapDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#334155',
  },
  heatmapDotActive: {
    backgroundColor: '#4ade80',
    shadowColor: '#4ade80',
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  heatmapLabel: { color: 'white', fontSize: 9, fontWeight: 'bold' },
  heatmapSubLabel: { color: '#64748b', fontSize: 8 },

  // Stats
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  statUnit: { fontSize: 14, color: '#94a3b8' },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginTop: 4 },

  // Filters
  filterScroll: { maxHeight: 40, marginBottom: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  chipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: 'white' },

  // List Headers
  monthHeader: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContainer: { gap: 12 },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: '#64748b' },
});
