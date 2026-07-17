// hooks/useWorkoutData.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutTemplate, WorkoutLog, UserProfile } from '../types';

export const useWorkoutData = () => {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ weightLogs: [], height: 0 });
  
  // This is the most important part: The Loading State
  const [loading, setLoading] = useState(true);

  // 1. LOAD DATA ON STARTUP
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("📥 Loading data from storage...");
        const [storedTemplates, storedLogs, storedProfile] = await Promise.all([
          AsyncStorage.getItem('workout-templates'),
          AsyncStorage.getItem('workout-logs'),
          AsyncStorage.getItem('user-profile')
        ]);

        if (storedTemplates) {
            console.log("✅ Found saved templates");
            setTemplates(JSON.parse(storedTemplates));
        } else {
            // Set defaults ONLY if storage is empty
            console.log("⚠️ No templates found, using defaults");
            setTemplates([{
                id: 'default-1', name: 'Full Body Example', scheduleDays: [], exercises: []
            }]);
        }

        if (storedLogs) setLogs(JSON.parse(storedLogs));
        if (storedProfile) { const profile = JSON.parse(storedProfile); setUserProfile({ ...profile, weightLogs: Array.isArray(profile.weightLogs) ? profile.weightLogs : [] }); }

      } catch (e) {
        console.error("❌ Failed to load data", e);
      } finally {
        setLoading(false); // Tell the app we are done loading
      }
    };

    loadData();
  }, []);

  // 2. SAVE FUNCTIONS
  const saveTemplates = async (newTemplates: WorkoutTemplate[]) => {
    setTemplates(newTemplates);
    await AsyncStorage.setItem('workout-templates', JSON.stringify(newTemplates));
    console.log("💾 Templates saved!");
  };

  const saveLogs = async (newLogs: WorkoutLog[]) => {
    setLogs(newLogs);
    await AsyncStorage.setItem('workout-logs', JSON.stringify(newLogs));
    console.log("💾 Logs saved!");
  };

  const saveUserProfile = async (newProfile: UserProfile) => {
    await AsyncStorage.setItem('user-profile', JSON.stringify(newProfile));
    setUserProfile(newProfile);
    console.log("💾 Profile saved!");
  };

  // ... (keep your existing helper functions like saveTemplate, deleteTemplate, etc. that call the functions above) ...
  // Re-implementing one for clarity:
  const saveTemplate = (template: WorkoutTemplate) => {
    const exists = templates.find(t => t.id === template.id);
    const newTemplates = exists 
      ? templates.map(t => t.id === template.id ? template : t)
      : [...templates, template];
    saveTemplates(newTemplates);
  };
  
  const deleteTemplate = (id: string) => {
      saveTemplates(templates.filter(t => t.id !== id));
  };

  const addLog = (log: WorkoutLog) => {
      saveLogs([...logs, log]);
  };

  return {
    templates,
    logs,
    userProfile,
    loading, // <--- EXPORT THIS
    saveTemplate,
    deleteTemplate,
    addLog,
    setUserProfile: saveUserProfile
  };
};
