import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { WorkoutTemplate } from "../types";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error("API Key is missing! Check your .env file.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const generateWorkoutRoutine = async (prompt: string, currentTemplate?: WorkoutTemplate | null): Promise<WorkoutTemplate | null> => {
  
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", 
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          name: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          scheduleDays: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.INTEGER },
          },
          exercises: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                name: { type: SchemaType.STRING },
                
                // FIX: TypeScript requires 'format: "enum"' when using an enum array
                type: { 
                  type: SchemaType.STRING, 
                  format: "enum", 
                  enum: ["reps", "timer", "distance"] 
                },

                // Optional fields (omitted from 'required' list below)
                targetSets: { type: SchemaType.INTEGER },
                targetReps: { type: SchemaType.INTEGER },
                targetWeight: { type: SchemaType.NUMBER },
                targetDurationSeconds: { type: SchemaType.INTEGER },
                targetDistance: { type: SchemaType.NUMBER },
                
                // FIX: TypeScript requires 'format: "enum"' here as well
                targetDistanceUnit: { 
                  type: SchemaType.STRING, 
                  format: "enum",
                  enum: ["m", "km", "miles"]
                },

                restSeconds: { type: SchemaType.INTEGER },
                notes: { type: SchemaType.STRING }
              },
              // We only force these to be required. The rest are optional.
              required: ["id", "name", "type"]
            }
          }
        },
        required: ["id", "name", "exercises"]
      },
    },
  });

  let contentPrompt = "";

  if (currentTemplate) {
    contentPrompt = `
      I have this existing workout routine in JSON format:
      ${JSON.stringify(currentTemplate)}

      The user wants to modify it with this request: "${prompt}".
      
      Return the UPDATED JSON object. Keep the structure identical.
      `;
  } else {
    contentPrompt = `Create a detailed workout routine based on this request: "${prompt}". 
      Use "reps" for weights, "timer" for static/yoga, "distance" for cardio.
      Generate unique IDs.`;
  }

  const result = await model.generateContent(contentPrompt);
  const response = result.response;
  const text = response.text();

  if (!text) throw new Error("No response generated");

  return JSON.parse(text) as WorkoutTemplate;
};