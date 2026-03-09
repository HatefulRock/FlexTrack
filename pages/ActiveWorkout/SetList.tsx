import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import {
  CheckCircle2,
  MoreVertical,
  StopCircle,
  Play,
  Calculator,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { SetLog, Exercise } from "../../types";
import { formatTime, parseTimeString } from "../../utils/time";

interface SetListProps {
  exercise: Exercise;
  sets: SetLog[];
  historySets?: SetLog[];
  exerciseIndex: number;
  timers: { [key: string]: number };
  timerRunning: { [key: string]: boolean };
  onUpdateSet: (index: number, field: keyof SetLog, value: any) => void;
  onToggleComplete: (index: number) => void;
  onToggleTimer: (index: number) => void;
}

export const SetList = ({
  exercise,
  sets,
  historySets,
  exerciseIndex,
  timers,
  timerRunning,
  onUpdateSet,
  onToggleComplete,
  onToggleTimer,
}: SetListProps) => {
  const [expandedNotes, setExpandedNotes] = useState<{
    [key: string]: boolean;
  }>({});

  const toggleNote = (setIndex: number) => {
    const key = `${exerciseIndex}-${setIndex}`;
    setExpandedNotes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleComplete = (i: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onToggleComplete(i);
  };

  const getHistoryText = (index: number) => {
    if (!historySets || !historySets[index]) return "-";
    const h = historySets[index];

    if (exercise.type === "reps") return `${h.reps} x ${h.weight}kg`;
    if (exercise.type === "distance")
      return `${h.distance}km in ${formatTime(h.durationSeconds || 0)}`;
    if (exercise.type === "timer")
      return `${formatTime(h.durationSeconds || 0)}`;
    return "-";
  };

  const showPlateCalc = (weight: number) => {
    const bar = 20;
    if (weight <= bar) return Alert.alert("Empty Bar", "Just the bar (20kg)");

    let remainder = (weight - bar) / 2;
    const plates = [];

    [25, 20, 15, 10, 5, 2.5, 1.25].forEach((plate) => {
      while (remainder >= plate) {
        plates.push(plate);
        remainder -= plate;
      }
    });

    const text = plates.map((p) => `${p}kg`).join("\n+ ");
    Alert.alert("Per Side", `Load per side:\n\n${text}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerText, { flex: 1, textAlign: "center" }]}>
          Set
        </Text>
        <Text style={[styles.headerText, { flex: 3, paddingLeft: 8 }]}>
          Previous
        </Text>
        <Text style={[styles.headerText, { flex: 7 }]}>Log</Text>
        <View style={{ flex: 1 }} />
      </View>

      {sets.map((set, i) => {
        const isTimerRunning = timerRunning[`${exerciseIndex}-${i}`];
        const timerValue = timers[`${exerciseIndex}-${i}`] || 0;

        return (
          <View
            key={i}
            style={[
              styles.card,
              set.completed ? styles.cardCompleted : styles.cardDefault,
            ]}
          >
            <View style={styles.row}>
              {/* Set Number */}
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.setNumber,
                    set.completed && { color: "#86efac" },
                  ]}
                >
                  {set.setNumber}
                </Text>
              </View>

              {/* Real History Data */}
              <View style={{ flex: 3 }}>
                <Text style={styles.targetText}>{getHistoryText(i)}</Text>
              </View>

              {/* Inputs - Fixed Fragments Here */}
              <View style={{ flex: 7, flexDirection: "row", gap: 8 }}>
                {exercise.type === "reps" && (
                  /* Replaced Fragment <> with a View to handle flex/whitespace correctly */
                  <View style={{ flex: 1, flexDirection: "row", gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        value={set.reps?.toString() || ""}
                        placeholder={exercise.targetReps?.toString()}
                        placeholderTextColor="#475569"
                        keyboardType="numeric"
                        selectTextOnFocus={true}
                        onChangeText={(txt) =>
                          onUpdateSet(i, "reps", parseFloat(txt) || 0)
                        }
                        style={[
                          styles.input,
                          set.completed && styles.inputCompleted,
                        ]}
                      />
                    </View>
                    <View style={{ flex: 1, flexDirection: "row" }}>
                      <TextInput
                        value={set.weight?.toString() || ""}
                        placeholder={exercise.targetWeight?.toString() || "0"}
                        placeholderTextColor="#475569"
                        keyboardType="numeric"
                        selectTextOnFocus={true}
                        onChangeText={(txt) =>
                          onUpdateSet(i, "weight", parseFloat(txt) || 0)
                        }
                        style={[
                          styles.input,
                          set.completed && styles.inputCompleted,
                          {
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                          },
                        ]}
                      />
                      <TouchableOpacity
                        onPress={() => showPlateCalc(set.weight || 0)}
                        style={styles.calcBtn}
                      >
                        <Calculator size={12} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {exercise.type === "distance" && (
                  /* Replaced Fragment <> with View */
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <TextInput
                      placeholder="0:00"
                      placeholderTextColor="#64748b"
                      value={formatTime(set.durationSeconds || 0)}
                      selectTextOnFocus={true}
                      onChangeText={(txt) =>
                        onUpdateSet(i, "durationSeconds", parseTimeString(txt))
                      }
                      style={[styles.input, { flex: 1 }]}
                    />
                    <Text style={styles.unitText}>m</Text>
                  </View>
                )}

                {exercise.type === "timer" && (
                  <TouchableOpacity
                    onPress={() => onToggleTimer(i)}
                    style={[
                      styles.timerButton,
                      isTimerRunning
                        ? styles.timerActive
                        : styles.timerInactive,
                    ]}
                  >
                    {isTimerRunning ? (
                      <StopCircle size={16} color="white" />
                    ) : (
                      <Play size={16} color="#cbd5e1" />
                    )}
                    <Text
                      style={
                        isTimerRunning
                          ? styles.timerTextActive
                          : styles.timerTextInactive
                      }
                    >
                      {formatTime(timerValue)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Check Button */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => handleComplete(i)}
                  style={[
                    styles.checkButton,
                    set.completed
                      ? styles.checkButtonCompleted
                      : styles.checkButtonDefault,
                  ]}
                >
                  <CheckCircle2
                    size={18}
                    color={set.completed ? "white" : "#94a3b8"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.notesSection}>
              {expandedNotes[`${exerciseIndex}-${i}`] ? (
                <View style={styles.noteInputContainer}>
                  <TextInput
                    placeholder="Add set notes..."
                    placeholderTextColor="#64748b"
                    value={set.notes || ""}
                    onChangeText={(txt) => onUpdateSet(i, "notes", txt)}
                    style={styles.noteInput}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => toggleNote(i)}
                  style={{ padding: 4 }}
                >
                  <MoreVertical
                    size={12}
                    color="#475569"
                    style={{ transform: [{ rotate: "90deg" }] }}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  headerRow: { flexDirection: "row", marginBottom: 8, paddingHorizontal: 8 },
  headerText: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  cardDefault: { backgroundColor: "#1e293b", borderColor: "#334155" },
  cardCompleted: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  row: { flexDirection: "row", padding: 12, alignItems: "center", gap: 8 },
  setNumber: { fontWeight: "bold", textAlign: "center", color: "#cbd5e1" },
  targetText: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  input: {
    backgroundColor: "black",
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 4,
    padding: 12,
    textAlign: "center",
    color: "white",
    flex: 1,
    fontSize: 16,
  },
  inputCompleted: { borderColor: "rgba(34, 197, 94, 0.5)", color: "#dcfce7" },
  unitText: { fontSize: 12, color: "#64748b", alignSelf: "center" },
  calcBtn: {
    backgroundColor: "#0f172a",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "#475569",
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  timerButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  timerInactive: { backgroundColor: "black", borderColor: "#475569" },
  timerActive: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: "#ef4444",
  },
  timerTextInactive: {
    color: "#cbd5e1",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  timerTextActive: {
    color: "white",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkButtonDefault: { backgroundColor: "#334155" },
  checkButtonCompleted: { backgroundColor: "#22c55e" },
  notesSection: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    alignItems: "center",
  },
  noteInputContainer: { width: "100%" },
  noteInput: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    color: "#cbd5e1",
    fontSize: 12,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
});
