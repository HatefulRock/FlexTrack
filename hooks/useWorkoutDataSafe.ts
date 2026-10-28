import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, WorkoutLog, WorkoutTemplate } from '../types';
import { MAX_LOGS, sanitizeLog, sanitizeProfile, sanitizeTemplate } from '../utils/sanitize';
import { loadAll, removeLogs, Section, STARTER_TEMPLATES, writeLog, writeProfile, writeTemplates } from '../utils/storage';

export const useWorkoutData = () => {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [userProfile, setUserProfileState] = useState<UserProfile>({ weightLogs: [], height: 0 });
  const [unreadable, setUnreadable] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const templateRef = useRef<WorkoutTemplate[]>([]);
  const logRef = useRef<WorkoutLog[]>([]);
  const writeQueue = useRef<Partial<Record<Section, Promise<void>>>>({});
  // A section whose stored value exists but could not be read is never written: that would replace the user's data with defaults.
  const blocked = useRef(new Set<Section>());

  const persist = useCallback((section: Section, write: () => Promise<void>) => {
    if (blocked.current.has(section)) return Promise.reject(new Error('Stored data could not be read'));
    const previous = writeQueue.current[section] ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(write);
    writeQueue.current[section] = next;
    return next;
  }, []);

  useEffect(() => {
    let mounted = true;
    void loadAll(AsyncStorage)
      .then(data => {
        if (!mounted) return;
        data.blocked.forEach(section => blocked.current.add(section));
        templateRef.current = data.templates; logRef.current = data.logs;
        setTemplates(data.templates); setLogs(data.logs); setUserProfileState(data.profile); setUnreadable(data.unreadable);
      })
      .catch(() => {
        if (!mounted) return;
        (['templates', 'logs', 'profile'] as const).forEach(section => blocked.current.add(section));
        templateRef.current = STARTER_TEMPLATES;
        logRef.current = [];
        setTemplates(STARTER_TEMPLATES);
        setLogs([]);
        setUserProfileState({ weightLogs: [], height: 0 });
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const saveTemplate = useCallback((template: WorkoutTemplate) => {
    const sanitized = sanitizeTemplate(template);
    if (!sanitized) return Promise.reject(new Error('Invalid workout template'));
    const current = templateRef.current;
    const next = current.some(item => item.id === sanitized.id)
      ? current.map(item => item.id === sanitized.id ? sanitized : item) : [...current, sanitized];
    templateRef.current = next; setTemplates(next);
    return persist('templates', () => writeTemplates(AsyncStorage, next));
  }, [persist]);
  const deleteTemplate = useCallback((id: string) => {
    const next = templateRef.current.filter(template => template.id !== id);
    templateRef.current = next; setTemplates(next);
    return persist('templates', () => writeTemplates(AsyncStorage, next));
  }, [persist]);
  // Writes only the new session's own key, never the whole history.
  const addLog = useCallback((log: WorkoutLog) => {
    const sanitized = sanitizeLog(log);
    if (!sanitized) return Promise.reject(new Error('Invalid workout log'));
    const all = [...logRef.current, sanitized];
    const dropped = all.length > MAX_LOGS ? [...all].sort((a, b) => a.startTime - b.startTime).slice(0, all.length - MAX_LOGS).map(item => item.id) : [];
    const next = dropped.length ? all.filter(item => !dropped.includes(item.id)) : all;
    logRef.current = next; setLogs(next);
    return persist('logs', async () => { await writeLog(AsyncStorage, sanitized); await removeLogs(AsyncStorage, dropped); });
  }, [persist]);
  const setUserProfile = useCallback((profile: UserProfile) => {
    const sanitized = sanitizeProfile(profile);
    setUserProfileState(sanitized);
    return persist('profile', () => writeProfile(AsyncStorage, sanitized));
  }, [persist]);

  return { templates, logs, userProfile, unreadable, loading, saveTemplate, deleteTemplate, addLog, setUserProfile };
};
