import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Zap, ChevronRight, ChevronLeft } from "lucide-react-native";
import { useKeepAwake } from "expo-keep-awake";

import { WorkoutTemplate, WorkoutLog, ExerciseLog, SetLog } from "../../types";
import { generateId } from "../../utils/helpers";
import { formatTime } from "../../utils/time";
import { useWorkoutTimer } from "../../hooks/useWorkoutTimer";

// Components
import { RestControl } from "./RestControl";
import { ExerciseView } from "./ExerciseView";
import { SetList } from "./SetList";

interface ActiveWorkoutPageProps {
  template: WorkoutTemplate;
  previousLogs: WorkoutLog[];
  onFinish: (log: WorkoutLog) => void;
}

export const ActiveWorkoutPage = ({
  template,
  previousLogs,
  onFinish,
}: ActiveWorkoutPageProps) => {
  useKeepAwake();

  const [startTime] = useState(Date.now());
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [restExpanded, setRestExpanded] = useState(false);

  const [logs, setLogs] = useState<ExerciseLog[]>(
    template.exercises.map((e) => ({
      exerciseId: e.id,
      exerciseName: e.name,
      completed: false,
      sets: Array(e.targetSets || 1)
        .fill(0)
        .map((_, i) => ({
          setNumber: i + 1,
          completed: false,
          reps: e.targetReps,
          weight: e.targetWeight,
          distance: e.targetDistance,
          durationSeconds: e.targetDurationSeconds,
          notes: "",
        })),
    })),
  );

  const {
    timers,
    timerRunning,
    restTimer,
    isResting,
    toggleTimer,
    startRest,
    cancelRest,
    adjustRest,
  } = useWorkoutTimer();

  const currentExercise = template.exercises?.[activeExerciseIndex];
  const currentLog = logs[activeExerciseIndex];

  const historySets = useMemo(() => {
    if (!currentExercise) return undefined;

    const lastLogWithExercise = previousLogs
      .sort((a, b) => b.endTime - a.endTime)
      .find((log) =>
        log.exercises.some((e) => e.exerciseId === currentExercise.id),
      );

    if (!lastLogWithExercise) return undefined;

    return lastLogWithExercise.exercises.find(
      (e) => e.exerciseId === currentExercise.id,
    )?.sets;
  }, [currentExercise?.id, previousLogs]);

  useEffect(() => {
    const backAction = () => {
      if (Keyboard.isVisible?.()) {
        Keyboard.dismiss();
        return true;
      }
      if (restExpanded) {
        setRestExpanded(false);
        return true;
      }
      Alert.alert("Discard Workout?", "Current progress will be lost.", [
        { text: "Keep Going", onPress: () => null, style: "cancel" },
        {
          text: "Discard",
          onPress: () => onFinish(null as any),
          style: "destructive",
        },
      ]);
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, [restExpanded, onFinish]);

  const toggleSetComplete = (setIndex: number) => {
    const newLogs = [...logs];
    const set = newLogs[activeExerciseIndex].sets[setIndex];
    set.completed = !set.completed;
    setLogs(newLogs);

    if (set.completed && !isResting) {
      const restTime =
        currentExercise.restSeconds !== undefined
          ? currentExercise.restSeconds
          : 60;
      if (restTime > 0) {
        startRest(restTime);
        setRestExpanded(false);
      }
    }
  };

  const updateSet = (setIndex: number, field: keyof SetLog, value: any) => {
    const newLogs = [...logs];
    newLogs[activeExerciseIndex].sets[setIndex] = {
      ...newLogs[activeExerciseIndex].sets[setIndex],
      [field]: value,
    };
    setLogs(newLogs);
  };

  const handleToggleTimer = (setIndex: number) => {
    toggleTimer(`${activeExerciseIndex}-${setIndex}`);
  };

  const quickFinishExercise = () => {
    const newLogs = [...logs];
    newLogs[activeExerciseIndex].sets.forEach((set) => {
      if (!set.completed) {
        set.completed = true;
        if (!set.reps) set.reps = currentExercise.targetReps;
        if (!set.weight) set.weight = currentExercise.targetWeight;
      }
    });
    setLogs(newLogs);
    handleNext();
  };

  const handleNext = () => {
    cancelRest();
    if (activeExerciseIndex < template.exercises.length - 1) {
      setActiveExerciseIndex((prev) => prev + 1);
    } else {
      onFinish({
        id: generateId(),
        templateId: template.id,
        templateName: template.name,
        startTime,
        endTime: Date.now(),
        exercises: logs,
      });
    }
  };

  const handlePrev = () => {
    if (activeExerciseIndex > 0) setActiveExerciseIndex((prev) => prev - 1);
  };

  const progress = (activeExerciseIndex / template.exercises.length) * 100;

  if (!currentExercise || !currentLog) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: "white" }}>
          No exercises found in this template.
        </Text>
        <TouchableOpacity
          onPress={() => onFinish(null as any)}
          style={{ marginTop: 20, padding: 10, backgroundColor: "#333" }}
        >
          <Text style={{ color: "white" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>{template.name}</Text>
          <Text style={styles.headerTimer}>
            {formatTime(Math.floor((Date.now() - startTime) / 1000))}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Finish Workout?", "Save current progress?", [
              { text: "Cancel", style: "cancel" },
              { text: "Save & End", onPress: handleNext },
            ])
          }
          style={styles.endButton}
        >
          <Text style={styles.endButtonText}>End</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <ExerciseView
            exercise={currentExercise}
            index={activeExerciseIndex}
            total={template.exercises.length}
          />

          <View style={styles.quickFinishContainer}>
            <TouchableOpacity
              onPress={quickFinishExercise}
              style={styles.quickFinishButton}
            >
              {/* FIX: Removed whitespace between Zap and Text */}
              <Zap size={14} color="#38bdf8" />
              <Text style={styles.quickFinishText}>Quick Finish</Text>
            </TouchableOpacity>
          </View>

          <SetList
            exercise={currentExercise}
            sets={currentLog.sets}
            historySets={historySets}
            exerciseIndex={activeExerciseIndex}
            timers={timers}
            timerRunning={timerRunning}
            onUpdateSet={updateSet}
            onToggleComplete={toggleSetComplete}
            onToggleTimer={handleToggleTimer}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {isResting && (
        <RestControl
          restTimer={restTimer}
          expanded={restExpanded}
          onToggleExpand={() => setRestExpanded(!restExpanded)}
          onAdd={() => adjustRest(30)}
          onSubtract={() => adjustRest(-30)}
          onSkip={cancelRest}
        />
      )}

      {!restExpanded && (
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handlePrev}
            disabled={activeExerciseIndex === 0}
            style={[
              styles.footerBtn,
              styles.prevBtn,
              activeExerciseIndex === 0 && styles.disabledBtn,
            ]}
          >
            <ChevronLeft size={20} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.footerBtn, styles.nextBtn]}
          >
            {/* FIX: Removed whitespace between Text and Chevron */}
            <Text style={styles.nextBtnText}>
              {activeExerciseIndex === template.exercises.length - 1
                ? "Finish"
                : "Next Exercise"}
            </Text>
            <ChevronRight size={20} color="black" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  progressBarBg: { height: 4, backgroundColor: "#1e293b", width: "100%" },
  progressBarFill: { height: "100%", backgroundColor: "#38bdf8" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  headerTimer: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#38bdf8",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  endButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
  },
  endButtonText: { color: "#ef4444", fontSize: 12, fontWeight: "bold" },
  scrollContainer: { flex: 1, padding: 16 },
  quickFinishContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  quickFinishButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  quickFinishText: { fontSize: 12, color: "#38bdf8", fontWeight: "bold" },
  footer: {
    flexDirection: "row",
    gap: 16,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    backgroundColor: "black",
  },
  footerBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  prevBtn: { flex: 1, backgroundColor: "#1e293b" },
  disabledBtn: { opacity: 0.3 },
  nextBtn: { flex: 2, backgroundColor: "white", gap: 8 },
  nextBtnText: { color: "black", fontWeight: "bold" },
});
