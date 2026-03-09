import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { Scale, Ruler, Plus } from 'lucide-react-native';
import { UserProfile, BodyMetricLog } from '../../types';

interface BodyTabProps {
  userProfile: UserProfile;
  setUserProfile: (p: UserProfile) => void;
}

export const BodyTab = ({ userProfile, setUserProfile }: BodyTabProps) => {
    const [newWeight, setNewWeight] = useState<string>('');
    const [newHeight, setNewHeight] = useState<string>(userProfile.height?.toString() || '');

    const currentWeight = userProfile.weightLogs.length > 0 ? userProfile.weightLogs[userProfile.weightLogs.length - 1].weight : 0;
    
    // Calculate BMI
    const bmi = (userProfile.height && currentWeight) 
        ? (currentWeight / ((userProfile.height / 100) ** 2)).toFixed(1) 
        : '--';

    const getBMIStatus = (bmiVal: string) => {
        const num = parseFloat(bmiVal);
        if (isNaN(num)) return { text: 'N/A', color: '#64748b' }; // slate-500
        if (num < 18.5) return { text: 'Underweight', color: '#60a5fa' }; // blue-400
        if (num < 25) return { text: 'Healthy', color: '#4ade80' }; // green-400
        if (num < 30) return { text: 'Overweight', color: '#facc15' }; // yellow-400
        return { text: 'Obese', color: '#f87171' }; // red-400
    };
    const bmiStatus = getBMIStatus(bmi);

    const handleAddWeight = () => {
        if (!newWeight) return;
        const newLog: BodyMetricLog = { date: Date.now(), weight: parseFloat(newWeight) };
        const updatedLogs = [...userProfile.weightLogs, newLog].sort((a, b) => a.date - b.date);
        setUserProfile({ ...userProfile, weightLogs: updatedLogs });
        setNewWeight('');
    };

    const handleUpdateHeight = () => {
        if(!newHeight) return;
        setUserProfile({ ...userProfile, height: parseFloat(newHeight) });
    };

    // Prepare Data for React Native Chart Kit
    const chartLabels = userProfile.weightLogs.map(l => 
        new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    );
    const chartData = userProfile.weightLogs.map(l => l.weight);

    return (
        <View style={styles.container}>
            
            {/* Top Cards Grid */}
            <View style={styles.grid}>
                {/* Weight Card */}
                <View style={styles.card}>
                    <Scale color="#10b981" size={24} style={styles.icon} />
                    <View style={styles.cardContent}>
                        <Text style={styles.cardValue}>
                            {currentWeight || '--'} <Text style={styles.unit}>kg</Text>
                        </Text>
                        <Text style={styles.cardLabel}>Current Weight</Text>
                    </View>
                </View>

                {/* Height Card */}
                <View style={styles.card}>
                    <Ruler color="#10b981" size={24} style={styles.icon} />
                    <View style={styles.cardContent}>
                        {userProfile.height ? (
                            <Text style={styles.cardValue}>
                                {userProfile.height} <Text style={styles.unit}>cm</Text>
                            </Text>
                        ) : (
                            <TextInput 
                                placeholder="Height (cm)" 
                                placeholderTextColor="#64748b"
                                keyboardType="numeric"
                                style={styles.heightInput}
                                value={newHeight}
                                onChangeText={setNewHeight}
                                onBlur={handleUpdateHeight}
                            />
                        )}
                        <Text style={styles.cardLabel}>Height</Text>
                    </View>
                </View>
            </View>

            {/* BMI Banner */}
            <LinearGradient 
                colors={['#1e293b', '#0f172a']} // Surface to slate-900
                style={styles.bmiCard}
            >
                <View>
                    <Text style={styles.bmiLabel}>Body Mass Index</Text>
                    <Text style={styles.bmiValue}>{bmi}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.bmiStatusText, { color: bmiStatus.color }]}>
                        {bmiStatus.text}
                    </Text>
                    <Text style={styles.bmiScoreLabel}>BMI Score</Text>
                </View>
            </LinearGradient>

            {/* Chart Section */}
            <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                    <Text style={styles.sectionTitle}>Weight History</Text>
                    <View style={styles.chartControls}>
                        <TextInput 
                            placeholder="kg"
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                            value={newWeight}
                            onChangeText={setNewWeight}
                            style={styles.weightInput}
                        />
                        <TouchableOpacity onPress={handleAddWeight} style={styles.addButton}>
                            <Plus size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
                
                {chartData.length > 1 ? (
                    <View style={{ overflow: 'hidden', borderRadius: 16 }}>
                        <LineChart
                            data={{
                                labels: chartLabels.slice(-5), // Only show last 5 dates to avoid crowding
                                datasets: [{ data: chartData }]
                            }}
                            width={Dimensions.get("window").width - 64} // Screen width minus padding
                            height={220}
                            yAxisSuffix="kg"
                            chartConfig={{
                                backgroundColor: "#1e293b",
                                backgroundGradientFrom: "#1e293b",
                                backgroundGradientTo: "#1e293b",
                                decimalPlaces: 1,
                                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Emerald-500
                                labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`, // Slate-400
                                style: { borderRadius: 16 },
                                propsForDots: { r: "4", strokeWidth: "2", stroke: "#10b981" }
                            }}
                            bezier // Makes the line curved like AreaChart
                            style={{ marginVertical: 8, borderRadius: 16 }}
                        />
                    </View>
                ) : (
                    <View style={styles.emptyChart}>
                        <Scale color="#64748b" size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                        <Text style={styles.emptyChartText}>Log at least 2 entries to see trend.</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    gap: 24, // space-y-6
    paddingHorizontal: 4, // slight buffer
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#1e293b', // bg-surface
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155', // border-slate-700
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 8,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  unit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#94a3b8',
  },
  cardLabel: {
    fontSize: 10,
    color: '#10b981', // emerald-500
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  heightInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: 'white',
    textAlign: 'center',
    borderRadius: 4,
    padding: 4,
    width: 80,
    borderWidth: 1,
    borderColor: '#475569',
  },
  
  // BMI Card
  bmiCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bmiLabel: {
    color: '#94a3b8',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  bmiValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
  },
  bmiStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bmiScoreLabel: {
    fontSize: 12,
    color: '#64748b',
  },

  // Chart Container
  chartContainer: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    // shadow-lg
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#e2e8f0', // slate-200
    fontWeight: 'bold',
    fontSize: 16,
  },
  chartControls: {
    flexDirection: 'row',
    gap: 8,
  },
  weightInput: {
    width: 64,
    backgroundColor: 'black',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#059669', // emerald-600
    padding: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChart: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  emptyChartText: {
    color: '#64748b',
    fontSize: 14,
  }
});