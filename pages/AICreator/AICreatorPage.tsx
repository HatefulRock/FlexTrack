// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   StyleSheet,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   SafeAreaView,
// } from "react-native";
// import { Sparkles, X, AlertCircle } from "lucide-react-native";

// import { Header } from "../../components/layout/Header";
// import { generateWorkoutRoutine } from "../../services/geminiService";
// import { WorkoutTemplate } from "../../types";

// interface AICreatorPageProps {
//   onSave: (t: WorkoutTemplate) => void;
//   onCancel: () => void;
// }

// // --- HELPER: Translate Tech Errors to User Friendly Text ---
// const getFriendlyErrorMessage = (error: any) => {
//   const msg = error?.toString().toLowerCase() || "";

//   if (
//     msg.includes("429") ||
//     msg.includes("quota") ||
//     msg.includes("exhausted")
//   ) {
//     return "AI usage limit reached. Please try again later.";
//   }
//   if (msg.includes("404") || msg.includes("not found")) {
//     return "AI Model unavailable. Please check API configuration.";
//   }
//   if (
//     msg.includes("network") ||
//     msg.includes("fetch") ||
//     msg.includes("internet")
//   ) {
//     return "Connection failed. Please check your internet.";
//   }
//   if (msg.includes("candidate") || msg.includes("safety")) {
//     return "I couldn't generate that due to safety filters. Please rephrase.";
//   }

//   // Default fallback
//   return "Something went wrong. Please try again.";
// };

// export const AICreatorPage = ({ onSave, onCancel }: AICreatorPageProps) => {
//   const [prompt, setPrompt] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const [generatedTemplate, setGeneratedTemplate] =
//     useState<WorkoutTemplate | null>(null);
//   const [refinementPrompt, setRefinementPrompt] = useState("");

//   const handleGenerate = async () => {
//     if (!prompt.trim()) return;
//     setLoading(true);
//     setError(null);

//     try {
//       const template = await generateWorkoutRoutine(prompt);
//       setGeneratedTemplate(template);
//     } catch (e: any) {
//       console.error("AI Gen Error:", e);
//       setError(getFriendlyErrorMessage(e));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRefine = async () => {
//     if (!refinementPrompt.trim() || !generatedTemplate) return;
//     setLoading(true);
//     setError(null);

//     try {
//       const updated = await generateWorkoutRoutine(
//         refinementPrompt,
//         generatedTemplate,
//       );
//       setGeneratedTemplate(updated);
//       setRefinementPrompt("");
//     } catch (e: any) {
//       console.error("AI Refine Error:", e);
//       setError(getFriendlyErrorMessage(e));
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- COMPONENT: Error Banner ---
//   const ErrorBanner = () => {
//     if (!error) return null;
//     return (
//       <View style={styles.errorContainer}>
//         <AlertCircle size={20} color="#f87171" />
//         <Text style={styles.errorText}>{error}</Text>
//       </View>
//     );
//   };

//   // --- VIEW 1: PREVIEW MODE ---
//   if (generatedTemplate) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <Header
//           title="Preview Workout"
//           onBack={() => setGeneratedTemplate(null)}
//           rightAction={
//             <TouchableOpacity onPress={() => onSave(generatedTemplate)}>
//               <Text style={styles.saveText}>Save</Text>
//             </TouchableOpacity>
//           }
//         />

//         <View style={styles.flexContainer}>
//           <ScrollView style={styles.scrollContent}>
//             {/* Summary Card */}
//             <View style={styles.summaryCard}>
//               <Text style={styles.summaryTitle}>{generatedTemplate.name}</Text>
//               <Text style={styles.summaryDesc}>
//                 {generatedTemplate.description}
//               </Text>
//             </View>

//             {/* Exercise List */}
//             <View style={styles.listContainer}>
//               {generatedTemplate.exercises.map((ex, i) => (
//                 <View key={i} style={styles.exerciseCard}>
//                   <View>
//                     <Text style={styles.exerciseName}>{ex.name}</Text>
//                     <Text style={styles.exerciseDetails}>
//                       {ex.type === "reps" &&
//                         `${ex.targetSets}x${ex.targetReps} • ${ex.targetWeight || 0}kg`}
//                       {ex.type === "timer" && `${ex.targetDurationSeconds}s`}
//                       {ex.type === "distance" &&
//                         `${ex.targetDistance}${ex.targetDistanceUnit}`}
//                       {ex.restSeconds ? ` • ${ex.restSeconds}s rest` : ""}
//                     </Text>
//                   </View>
//                 </View>
//               ))}
//             </View>
//           </ScrollView>

//           {/* Bottom Refinement Input */}
//           <KeyboardAvoidingView
//             behavior={Platform.OS === "ios" ? "padding" : "height"}
//             keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
//           >
//             <ErrorBanner />

//             <View style={styles.refinementContainer}>
//               <Text style={styles.label}>Refine with AI</Text>
//               <View style={styles.inputRow}>
//                 <TextInput
//                   style={styles.refineInput}
//                   placeholder="e.g. Make it harder..."
//                   placeholderTextColor="#64748b"
//                   value={refinementPrompt}
//                   onChangeText={setRefinementPrompt}
//                 />
//                 <TouchableOpacity
//                   onPress={handleRefine}
//                   disabled={loading}
//                   style={styles.refineButton}
//                 >
//                   {loading ? (
//                     <ActivityIndicator size="small" color="white" />
//                   ) : (
//                     <Sparkles size={20} color="white" />
//                   )}
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </KeyboardAvoidingView>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // --- VIEW 2: INPUT MODE ---
//   return (
//     <SafeAreaView style={styles.container}>
//       <Header
//         title="AI Workout Creator"
//         rightAction={
//           <TouchableOpacity onPress={onCancel}>
//             <X color="white" />
//           </TouchableOpacity>
//         }
//       />

//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={styles.centeredContent}
//       >
//         <ScrollView contentContainerStyle={styles.scrollCenter}>
//           <View style={styles.iconCircle}>
//             <Sparkles size={32} color="white" />
//           </View>

//           <Text style={styles.heroTitle}>Describe your goal</Text>
//           <Text style={styles.heroSubtitle}>
//             Tell the AI what you want to achieve, equipment you have, or time
//             constraints.
//           </Text>

//           <TextInput
//             value={prompt}
//             onChangeText={(t) => {
//               setPrompt(t);
//               if (error) setError(null);
//             }}
//             placeholder="e.g. A 30-minute HIIT workout for home with no equipment, focusing on legs."
//             placeholderTextColor="#475569"
//             multiline
//             numberOfLines={4}
//             textAlignVertical="top"
//             style={[styles.textArea, error && styles.textAreaError]}
//           />

//           {/* Show Error Banner here */}
//           <View style={{ marginBottom: 16, width: "100%" }}>
//             <ErrorBanner />
//           </View>

//           <TouchableOpacity
//             onPress={handleGenerate}
//             disabled={loading || !prompt}
//             style={[
//               styles.generateButton,
//               (loading || !prompt) && styles.disabledButton,
//             ]}
//           >
//             {loading ? (
//               <>
//                 <ActivityIndicator size="small" color="white" />
//                 <Text style={styles.generateButtonText}>Generating...</Text>
//               </>
//             ) : (
//               <>
//                 <Sparkles size={20} color="white" />
//                 <Text style={styles.generateButtonText}>Generate Plan</Text>
//               </>
//             )}
//           </TouchableOpacity>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "black",
//   },
//   flexContainer: {
//     flex: 1,
//   },
//   saveText: {
//     color: "#38bdf8",
//     fontWeight: "bold",
//     fontSize: 16,
//   },
//   scrollContent: {
//     flex: 1,
//     padding: 16,
//   },
//   summaryCard: {
//     backgroundColor: "#1e293b",
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#334155",
//     marginBottom: 16,
//   },
//   summaryTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "white",
//     marginBottom: 4,
//   },
//   summaryDesc: {
//     color: "#94a3b8",
//     fontSize: 14,
//   },
//   listContainer: {
//     gap: 12,
//     paddingBottom: 24,
//   },
//   exerciseCard: {
//     backgroundColor: "#1e293b",
//     padding: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#334155",
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   exerciseName: {
//     fontWeight: "bold",
//     fontSize: 14,
//     color: "white",
//   },
//   exerciseDetails: {
//     fontSize: 12,
//     color: "#94a3b8",
//     marginTop: 2,
//   },

//   // Refinement Area
//   refinementContainer: {
//     padding: 16,
//     backgroundColor: "#1e293b",
//     borderTopWidth: 1,
//     borderTopColor: "#334155",
//   },
//   label: {
//     fontSize: 12,
//     color: "#94a3b8",
//     fontWeight: "bold",
//     textTransform: "uppercase",
//     marginBottom: 8,
//   },
//   inputRow: {
//     flexDirection: "row",
//     gap: 8,
//   },
//   refineInput: {
//     flex: 1,
//     backgroundColor: "black",
//     borderWidth: 1,
//     borderColor: "#334155",
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     color: "white",
//     fontSize: 14,
//   },
//   refineButton: {
//     backgroundColor: "#6366f1",
//     padding: 10,
//     borderRadius: 8,
//     justifyContent: "center",
//     alignItems: "center",
//     width: 44,
//   },

//   // Input Mode
//   centeredContent: {
//     flex: 1,
//   },
//   scrollCenter: {
//     flexGrow: 1,
//     padding: 24,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   iconCircle: {
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     backgroundColor: "#0c4a6e",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 24,
//   },
//   heroTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "white",
//     marginBottom: 8,
//   },
//   heroSubtitle: {
//     color: "#94a3b8",
//     textAlign: "center",
//     marginBottom: 32,
//     maxWidth: 300,
//   },
//   textArea: {
//     width: "100%",
//     height: 128,
//     backgroundColor: "#1e293b",
//     borderWidth: 1,
//     borderColor: "#334155",
//     borderRadius: 12,
//     padding: 16,
//     color: "white",
//     fontSize: 16,
//     marginBottom: 24,
//   },
//   textAreaError: {
//     borderColor: "#f87171", // Red border on error
//   },
//   generateButton: {
//     width: "100%",
//     backgroundColor: "#38bdf8",
//     paddingVertical: 16,
//     borderRadius: 12,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     gap: 8,
//   },
//   disabledButton: {
//     backgroundColor: "#1e293b",
//     opacity: 0.5,
//   },
//   generateButtonText: {
//     color: "white",
//     fontWeight: "bold",
//     fontSize: 16,
//   },

//   // Error Banner Styles
//   errorContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "rgba(248, 113, 113, 0.1)", // Light red bg
//     padding: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "rgba(248, 113, 113, 0.3)",
//     marginBottom: 16,
//     gap: 8,
//     width: "100%",
//   },
//   errorText: {
//     color: "#f87171", // Red-400
//     fontSize: 14,
//     flex: 1, // Wraps text
//   },
// });

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Sparkles, X, Hammer, Rocket } from "lucide-react-native";

import { Header } from "../../components/layout/Header";
import { WorkoutTemplate } from "../../types";

interface AICreatorPageProps {
  onSave: (t: WorkoutTemplate) => void;
  onCancel: () => void;
}

export const AICreatorPage = ({ onSave, onCancel }: AICreatorPageProps) => {
  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="AI Creator"
        rightAction={
          <TouchableOpacity onPress={onCancel}>
            <X color="white" size={24} />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* Icon Container */}
        <View style={styles.iconCircle}>
          <Sparkles size={40} color="#38bdf8" />
        </View>

        <Text style={styles.title}>Coming Soon</Text>

        <Text style={styles.description}>
          We are currently training our AI to build the perfect workout routines
          for you. Check back later for smart, personalized workout generation.
        </Text>

        <TouchableOpacity onPress={onCancel} style={styles.button}>
          <Text style={styles.buttonText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(56, 189, 248, 0.1)", // Faint blue bg
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#94a3b8", // Slate-400
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 300,
  },
  button: {
    backgroundColor: "#1e293b",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
