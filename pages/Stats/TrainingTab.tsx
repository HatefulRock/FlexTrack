import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
  ScrollView,
} from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import {
  Calendar,
  ChevronDown,
  X,
  Trophy,
  Dumbbell,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { isSameDay } from "date-fns";
import { WorkoutLog } from "../../types";

const getMuscleGroup = (name: string) => {
  const n = name.toLowerCase();
  if (
    n.includes("bench") ||
    n.includes("press") ||
    n.includes("push") ||
    n.includes("dip")
  )
    return "Push";
  if (
    n.includes("pull") ||
    n.includes("row") ||
    n.includes("curl") ||
    n.includes("deadlift")
  )
    return "Pull";
  if (
    n.includes("squat") ||
    n.includes("leg") ||
    n.includes("lunge") ||
    n.includes("calf")
  )
    return "Legs";
  if (n.includes("run") || n.includes("cardio")) return "Cardio";
  return "Other";
};

interface TrainingTabProps {
  logs: WorkoutLog[];
}

export const TrainingTab = ({ logs }: TrainingTabProps) => {
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>("");
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [showOneRepMax, setShowOneRepMax] = useState(false);

  const exercises = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => l.exercises.forEach((e) => set.add(e.exerciseName)));
    return Array.from(set).sort();
  }, [logs]);

  useEffect(() => {
    if (!selectedExerciseName && exercises.length > 0) {
      setSelectedExerciseName(exercises[0]);
    }
  }, [exercises, selectedExerciseName]);

  const personalRecords = useMemo(() => {
    const maxByExercise: { [name: string]: number } = {};
    logs.forEach(l => l.exercises.forEach(e => e.sets.forEach(s => {
      if (s.weight && s.weight > (maxByExercise[e.exerciseName] || 0))
        maxByExercise[e.exerciseName] = s.weight;
    })));
    return Object.entries(maxByExercise)
      .map(([name, weight]) => ({ name, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8);
  }, [logs]);

  const muscleData = useMemo(() => {
    const counts: { [key: string]: number } = {
      Push: 0,
      Pull: 0,
      Legs: 0,
      Cardio: 0,
      Other: 0,
    };
    logs.forEach((log) => {
      log.exercises.forEach((ex) => {
        const group = getMuscleGroup(ex.exerciseName);
        if (counts[group] !== undefined) counts[group]++;
      });
    });

    return [
      { name: "Push", color: "#60a5fa", legendFontColor: "#cbd5e1" },
      { name: "Pull", color: "#f472b6", legendFontColor: "#cbd5e1" },
      { name: "Legs", color: "#34d399", legendFontColor: "#cbd5e1" },
      { name: "Cardio", color: "#fbbf24", legendFontColor: "#cbd5e1" },
    ]
      .map((item) => ({
        ...item,
        population: counts[item.name] || 0,
        legendFontSize: 12,
      }))
      .filter((item) => item.population > 0);
  }, [logs]);

  const trainingData = useMemo(() => {
    if (!selectedExerciseName) return { labels: [], datasets: [{ data: [] }] };

    const relevantLogs = logs
      .filter((l) =>
        l.exercises.some((e) => e.exerciseName === selectedExerciseName),
      )
      .sort((a, b) => a.startTime - b.startTime);

    const dataPoints = relevantLogs
      .map((log) => {
        const exercise = log.exercises.find(
          (e) => e.exerciseName === selectedExerciseName,
        );
        if (!exercise) return null;

        let bestMetric = 0;
        exercise.sets.forEach((s) => {
          const w = s.weight || 0;
          const r = s.reps || 0;

          if (showOneRepMax) {
            const oneRM = w * (1 + r / 30);
            if (oneRM > bestMetric) bestMetric = oneRM;
          } else {
            if (w > bestMetric) bestMetric = w;
          }
        });

        return {
          date: new Date(log.startTime).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          value: Math.round(bestMetric),
        };
      })
      .filter(Boolean) as { date: string; value: number }[];

    return {
      labels: dataPoints.map((d) => d.date),
      datasets: [{ data: dataPoints.map((d) => d.value) }],
    };
  }, [logs, selectedExerciseName, showOneRepMax]);

  const consistencyData = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const count = logs.filter(l => isSameDay(new Date(l.startTime), d)).length;
      const dayName = d.toDateString().split(" ")[0][0];
      days.push({ day: dayName, count });
    }
    return days;
  }, [logs]);

  return (
    <View style={styles.container}>
      {/* SECTION 1: Personal Records */}
      {personalRecords.length > 0 && (
        <View>
          <View style={styles.sectionHeader}>
            {/* FIX 1: Removed whitespace */}
            <Trophy size={16} color="#fbbf24" />
            <Text style={styles.sectionTitle}>Personal Records</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.prScroll}
          >
            {personalRecords.map((rec, i) => (
              <LinearGradient
                key={i}
                colors={["#1e293b", "#0f172a"]}
                style={styles.prCard}
              >
                <Text style={styles.prLabel}>{rec.name}</Text>
                <Text style={styles.prValue}>
                  {rec.weight}
                  <Text style={styles.prUnit}>kg</Text>
                </Text>
              </LinearGradient>
            ))}
          </ScrollView>
        </View>
      )}

      {/* SECTION 2: Consistency Chart */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {/* FIX 2: Removed whitespace */}
          <Calendar size={18} color="#0ea5e9" />
          <Text style={styles.cardTitle}>Consistency (14 Days)</Text>
        </View>
        <View style={styles.barChartContainer}>
          {consistencyData.map((d, i) => (
            <View key={i} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height:
                        d.count > 0 ? `${Math.min(d.count * 30, 100)}%` : 4,
                      backgroundColor: d.count > 0 ? "#0ea5e9" : "#334155",
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* SECTION 3: Muscle Split */}
      {muscleData.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            {/* FIX 3: Removed whitespace */}
            <Dumbbell size={18} color="#34d399" />
            <Text style={styles.cardTitle}>Training Split</Text>
          </View>
          <PieChart
            data={muscleData}
            width={Dimensions.get("window").width - 64}
            height={180}
            chartConfig={{ color: (opacity = 1) => `white` }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            center={[10, 0]}
            absolute
          />
        </View>
      )}

      {/* SECTION 4: Progression Chart */}
      <View style={[styles.card, styles.shadowCard]}>
        <View style={styles.chartHeaderRow}>
          <View>
            <Text style={styles.chartTitle}>Progression</Text>
            <Text style={styles.chartSubtitle}>
              {showOneRepMax ? "Estimated 1 Rep Max" : "Heaviest Lift"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowOneRepMax(!showOneRepMax)}
            style={styles.toggleButton}
          >
            <Text style={styles.toggleText}>
              {showOneRepMax ? "1RM" : "Weight"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.inlineSelector}
          onPress={() => setIsSelectorOpen(true)}
        >
          <Text style={styles.selectorText}>
            {selectedExerciseName || "Select Exercise"}
          </Text>
          <ChevronDown size={16} color="#94a3b8" />
        </TouchableOpacity>

        {trainingData.labels.length > 0 ? (
          <View style={{ overflow: "hidden", borderRadius: 16, marginTop: 16 }}>
            <LineChart
              data={trainingData}
              width={Dimensions.get("window").width - 80}
              height={220}
              yAxisSuffix="kg"
              chartConfig={{
                backgroundColor: "#1e293b",
                backgroundGradientFrom: "#1e293b",
                backgroundGradientTo: "#1e293b",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                propsForDots: { r: "4", strokeWidth: "2", stroke: "#0ea5e9" },
              }}
              bezier
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No data available for this exercise.
            </Text>
          </View>
        )}
      </View>

      {/* MODAL */}
      <Modal visible={isSelectorOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Exercise</Text>
              <TouchableOpacity onPress={() => setIsSelectorOpen(false)}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={exercises}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedExerciseName(item);
                    setIsSelectorOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      item === selectedExerciseName && styles.selectedItemText,
                    ]}
                  >
                    {item}
                  </Text>
                  {item === selectedExerciseName && (
                    <View style={styles.selectedDot} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  prScroll: { marginBottom: 8 },
  prCard: {
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#334155",
    minWidth: 120,
    alignItems: "center",
  },
  prLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  prValue: { color: "white", fontSize: 20, fontWeight: "bold" },
  prUnit: { fontSize: 12, color: "#64748b" },
  card: {
    backgroundColor: "#1e293b",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  shadowCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: { color: "#e2e8f0", fontWeight: "bold", fontSize: 16 },
  barChartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 64,
    alignItems: "flex-end",
    gap: 4,
  },
  barColumn: { flex: 1, alignItems: "center", gap: 4 },
  barTrack: { width: "100%", height: "100%", justifyContent: "flex-end" },
  barFill: {
    width: "100%",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    minHeight: 4,
  },
  barLabel: { fontSize: 10, color: "#64748b", fontWeight: "bold" },
  chartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  chartTitle: { color: "white", fontSize: 16, fontWeight: "bold" },
  chartSubtitle: { color: "#94a3b8", fontSize: 12 },
  toggleButton: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  toggleText: { color: "#0ea5e9", fontSize: 12, fontWeight: "bold" },
  inlineSelector: {
    backgroundColor: "black",
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorText: { color: "white", fontSize: 14 },
  emptyState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
    borderStyle: "dashed",
    borderRadius: 16,
    marginTop: 16,
  },
  emptyText: { color: "#64748b" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "50%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  modalTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalItemText: { color: "#94a3b8", fontSize: 16 },
  selectedItemText: { color: "#0ea5e9", fontWeight: "bold" },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0ea5e9",
  },
});
