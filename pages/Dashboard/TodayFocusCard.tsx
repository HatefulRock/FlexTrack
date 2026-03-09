import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Play } from "lucide-react-native";
import { WorkoutTemplate } from "../../types";

interface TodayFocusCardProps {
  todaysWorkouts: WorkoutTemplate[];
  onStartWorkout: (t: WorkoutTemplate) => void;
  onBrowse: () => void;
}

export const TodayFocusCard = ({
  todaysWorkouts,
  onStartWorkout,
  onBrowse,
}: TodayFocusCardProps) => {
  return (
    <LinearGradient colors={["#0ea5e9", "#1d4ed8"]} style={styles.container}>
      <Text style={styles.date}>
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </Text>

      <Text style={styles.title}>Ready to train?</Text>

      {todaysWorkouts.length > 0 ? (
        <View style={styles.listContainer}>
          {todaysWorkouts.map((workout, idx) => (
            <View
              key={workout.id}
              style={[
                styles.workoutCard,
                idx === 0 ? styles.cardHighlight : styles.cardStandard,
              ]}
            >
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Scheduled</Text>
                </View>
              </View>

              <Text style={styles.workoutName}>{workout.name}</Text>
              <Text style={styles.workoutDetails}>
                {workout.exercises.length} Exercises
              </Text>

              <TouchableOpacity
                onPress={() => onStartWorkout(workout)}
                style={styles.startButton}
              >
                {/* FIX: Removed whitespace between Play and Text */}
                <Play size={20} color="#0284c7" fill="#0284c7" />
                <Text style={styles.startButtonText}>Start Workout</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Rest day! Or pick a routine from your list.
          </Text>
          <TouchableOpacity onPress={onBrowse} style={styles.browseButton}>
            <Text style={styles.browseButtonText}>Browse Workouts</Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  date: { color: "#dbeafe", marginBottom: 4, fontSize: 14 },
  title: { fontSize: 30, fontWeight: "bold", color: "white", marginBottom: 16 },
  listContainer: { gap: 12 },
  workoutCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cardHighlight: { backgroundColor: "rgba(255, 255, 255, 0.15)" },
  cardStandard: { backgroundColor: "rgba(255, 255, 255, 0.05)" },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 8,
    justifyContent: "space-between",
  },
  badge: {
    backgroundColor: "#4ade80",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    color: "#14532d",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  workoutName: { fontSize: 20, fontWeight: "bold", color: "white" },
  workoutDetails: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 16,
  },
  startButton: {
    width: "100%",
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  startButtonText: { color: "#0284c7", fontWeight: "bold", fontSize: 16 },
  emptyCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  emptyText: { marginBottom: 16, textAlign: "center", color: "#dbeafe" },
  browseButton: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
  },
  browseButtonText: { color: "white", fontWeight: "600" },
});
