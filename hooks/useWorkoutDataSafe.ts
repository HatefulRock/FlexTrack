import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, WorkoutLog, WorkoutTemplate } from '../types';
import { MAX_LOGS, sanitizeLog, sanitizeProfile, sanitizeTemplate } from '../utils/sanitize';
import { loadAll, removeLogs, Section, writeLog, writeLogs, writeProfile, writeTemplates } from '../utils/storage';
import { ImportedData, ImportPlan, planImport } from '../utils/importData';

export const useWorkoutData = () => {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [userProfile, setUserProfileState] = useState<UserProfile>({ weightLogs: [], height: 0 });
  const [unreadable, setUnreadable] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const templateRef = useRef<WorkoutTemplate[]>([]);
  const logRef = useRef<WorkoutLog[]>([]);
  const profileRef = useRef<UserProfile>({ weightLogs: [], height: 0 });
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
        templateRef.current = data.templates; logRef.current = data.logs; profileRef.current = data.profile;
        setTemplates(data.templates); setLogs(data.logs); setUserProfileState(data.profile); setUnreadable(data.unreadable);
      })
      .catch(() => {
        if (!mounted) return;
        (['templates', 'logs', 'profile'] as const).forEach(section => blocked.current.add(section));
        templateRef.current = [];
        logRef.current = [];
        setTemplates([]);
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
    profileRef.current = sanitized; setUserProfileState(sanitized);
    return persist('profile', () => writeProfile(AsyncStorage, sanitized));
  }, [persist]);

  // Adds a backup's workouts, sessions and weight entries to what is already here, planned against the current data at
  // the moment it runs. Each section is written on its own; a section that fails (or is blocked) is reported and the
  // rest still land, and importing the same file again adds only what is still missing.
  const importData = useCallback(async (incoming: ImportedData): Promise<{ plan: ImportPlan; failed: Section[] }> => {
    const plan = planImport({ templates: templateRef.current, logs: logRef.current, profile: profileRef.current }, incoming);
    const writes: [Section, Promise<void>][] = [];
    // A blocked section keeps showing what was read; persist rejects its write, which is reported as a failure.
    const open = (section: Section) => !blocked.current.has(section);
    if (plan.templates.length) {
      const next = [...templateRef.current, ...plan.templates];
      if (open('templates')) { templateRef.current = next; setTemplates(next); }
      writes.push(['templates', persist('templates', () => writeTemplates(AsyncStorage, next))]);
    }
    if (plan.logs.length) {
      const all = [...logRef.current, ...plan.logs].sort((a, b) => a.startTime - b.startTime);
      const dropped = all.slice(0, Math.max(0, all.length - MAX_LOGS)).map(item => item.id);
      const next = all.slice(-MAX_LOGS);
      if (open('logs')) { logRef.current = next; setLogs(next); }
      writes.push(['logs', persist('logs', async () => { await writeLogs(AsyncStorage, plan.logs); await removeLogs(AsyncStorage, dropped); })]);
    }
    if (plan.weightLogs.length || plan.height) {
      const current = profileRef.current;
      const next = sanitizeProfile({ height: plan.height ?? current.height, weightLogs: [...current.weightLogs, ...plan.weightLogs].sort((x, y) => x.date - y.date) });
      if (open('profile')) { profileRef.current = next; setUserProfileState(next); }
      writes.push(['profile', persist('profile', () => writeProfile(AsyncStorage, next))]);
    }
    const results = await Promise.allSettled(writes.map(([, write]) => write));
    return { plan, failed: writes.filter((_, i) => results[i].status === 'rejected').map(([section]) => section) };
  }, [persist]);

  return { templates, logs, userProfile, unreadable, loading, saveTemplate, deleteTemplate, addLog, setUserProfile, importData };
};
