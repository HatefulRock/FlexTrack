import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { WorkoutLog } from '../../types';

// Helper to categorize exercises (You can move this to a utility file)
const getMuscleGroup = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('bench') || n.includes('push') || n.includes('press') || n.includes('dip')) return 'Push';
    if (n.includes('pull') || n.includes('row') || n.includes('curl') || n.includes('deadlift')) return 'Pull';
    if (n.includes('squat') || n.includes('leg') || n.includes('lunge') || n.includes('calf')) return 'Legs';
    if (n.includes('run') || n.includes('cardio')) return 'Cardio';
    return 'Other';
};

export const MuscleBreakdown = ({ logs }: { logs: WorkoutLog[] }) => {
    const data = useMemo(() => {
        const counts: {[key: string]: number} = { Push: 0, Pull: 0, Legs: 0, Cardio: 0, Other: 0 };
        
        logs.forEach(log => {
            log.exercises.forEach(ex => {
                const group = getMuscleGroup(ex.exerciseName);
                counts[group] = (counts[group] || 0) + 1;
            });
        });

        // Filter out zero values and format for Chart Kit
        const chartData = [
            { name: 'Push', color: '#60a5fa', legendFontColor: '#cbd5e1' }, // Blue
            { name: 'Pull', color: '#f472b6', legendFontColor: '#cbd5e1' }, // Pink
            { name: 'Legs', color: '#34d399', legendFontColor: '#cbd5e1' }, // Emerald
            { name: 'Cardio', color: '#fbbf24', legendFontColor: '#cbd5e1' }, // Amber
            { name: 'Other', color: '#94a3b8', legendFontColor: '#cbd5e1' }, // Slate
        ].map(item => ({
            ...item,
            population: counts[item.name],
            legendFontSize: 12
        })).filter(item => item.population > 0);

        return chartData;
    }, [logs]);

    if (data.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Training Split</Text>
            <PieChart
                data={data}
                width={Dimensions.get("window").width - 32}
                height={200}
                chartConfig={{
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                center={[10, 0]}
                absolute
                hasLegend={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 24,
    },
    title: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 12,
    }
});