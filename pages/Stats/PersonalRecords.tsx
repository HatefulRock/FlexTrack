import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Trophy } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { WorkoutLog } from "../../types";

export const PersonalRecords = ({ logs }: { logs: WorkoutLog[] }) => {
  const keyLifts = ["Bench Press", "Squat", "Deadlift"];

  const records = keyLifts.map((lift) => {
    let maxWeight = 0;
    logs.forEach((log) => {
      log.exercises
        .filter((e) => e.exerciseName.includes(lift))
        .forEach((ex) => {
          ex.sets.forEach((s) => {
            if ((s.weight || 0) > maxWeight) maxWeight = s.weight || 0;
          });
        });
    });
    return { name: lift, weight: maxWeight };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* FIX: Removed whitespace between Icon and Text */}
        <Trophy size={18} color="#fbbf24" />
        <Text style={styles.title}>Personal Records</Text>
      </View>

      <View style={styles.grid}>
        {records.map((rec, i) => (
          <LinearGradient
            key={i}
            colors={["#334155", "#1e293b"]}
            style={styles.card}
          >
            <Text style={styles.liftName}>{rec.name}</Text>
            <Text style={styles.liftValue}>
              {rec.weight > 0 ? rec.weight : "--"}
              <Text style={styles.unit}>kg</Text>
            </Text>
          </LinearGradient>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  // Added gap: 8 here to handle spacing since we removed the whitespace in JSX
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: { color: "white", fontWeight: "bold", fontSize: 16 },
  grid: { flexDirection: "row", gap: 12 },
  card: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#475569",
    alignItems: "center",
  },
  liftName: {
    color: "#94a3b8",
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "bold",
    marginBottom: 4,
  },
  liftValue: { color: "white", fontSize: 18, fontWeight: "bold" },
  unit: { fontSize: 12, color: "#64748b", fontWeight: "normal" },
});
