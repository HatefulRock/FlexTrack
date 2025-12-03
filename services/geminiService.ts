import { GoogleGenAI, Type } from "@google/genai";
import { WorkoutTemplate } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateWorkoutRoutine = async (prompt: string, currentTemplate?: WorkoutTemplate | null): Promise<WorkoutTemplate | null> => {
  try {
    let contentPrompt = "";
    
    if (currentTemplate) {
        contentPrompt = `
        I have this existing workout routine in JSON format:
        ${JSON.stringify(currentTemplate)}

        The user wants to modify it with this request: "${prompt}".
        
        Return the UPDATED JSON object. Keep the structure identical. Ensure IDs are preserved if the exercise remains, or generate new IDs for new exercises.
        `;
    } else {
        contentPrompt = `Create a detailed workout routine based on this request: "${prompt}". 
        Ensure the exercises are real and practical. 
        For 'type':
        - Use 'reps' for weightlifting/calisthenics.
        - Use 'timer' for static holds or yoga.
        - Use 'distance' for running, swimming, cycling, or rowing.
        
        Generate a unique ID for the workout and each exercise (short strings are fine).
        If the user implies a schedule (e.g. "daily", "Mondays"), set scheduleDays accordingly (0=Sun, 1=Mon...6=Sat).`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contentPrompt,
      config: {
        systemInstruction: "You are an expert fitness coach. You create and modify structured JSON workout plans.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            scheduleDays: { 
                type: Type.ARRAY, 
                items: { type: Type.INTEGER },
                description: "Array of days (0=Sun...6=Sat) to schedule this workout."
            },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["reps", "timer", "distance"] },
                  targetSets: { type: Type.INTEGER },
                  targetReps: { type: Type.INTEGER },
                  targetWeight: { type: Type.NUMBER },
                  targetDurationSeconds: { type: Type.INTEGER },
                  targetDistance: { type: Type.NUMBER },
                  targetDistanceUnit: { type: Type.STRING, enum: ["m", "km", "miles"] },
                  restSeconds: { type: Type.INTEGER, description: "Rest time in seconds between sets" },
                  notes: { type: Type.STRING }
                },
                required: ["id", "name", "type"]
              }
            }
          },
          required: ["id", "name", "exercises"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as WorkoutTemplate;
  } catch (error) {
    console.error("Error generating workout:", error);
    return null;
  }
};