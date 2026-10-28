import { UserProfile, WorkoutLog, WorkoutTemplate } from '../types';
import { isRecord, MAX_LOGS, MAX_TEMPLATES, sanitizeLog, sanitizeProfile, sanitizeTemplate } from './sanitize';

// The subset of AsyncStorage used here, so tests can pass an in-memory store.
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
  multiGet(keys: readonly string[]): Promise<readonly (readonly [string, string | null])[]>;
  multiSet(pairs: readonly (readonly [string, string])[]): Promise<void>;
  multiRemove(keys: readonly string[]): Promise<void>;
}

export const KEYS = { templates: 'workout-templates', profile: 'user-profile', legacyLogs: 'workout-logs' } as const;
// One key per session: a single growing value outlives Android's ~2 MB per-row read limit within a few years of training.
const LOG_PREFIX = 'workout-log:';
export const logKey = (id: string) => `${LOG_PREFIX}${id}`;

const MAX_STORED_CHARACTERS = 5_000_000;
const BATCH = 500;

// First run gets one complete, startable routine instead of an empty example.
export const STARTER_TEMPLATES: WorkoutTemplate[] = [{
  id: 'starter-full-body', name: 'Full Body A', description: 'Three compound lifts and a plank. Edit the weights to match you.', scheduleDays: [],
  exercises: [
    { id: 'starter-squat', name: 'Back Squat', type: 'reps', loadMode: 'external', targetSets: 3, targetReps: 5, targetWeight: 40, restSeconds: 150 },
    { id: 'starter-bench', name: 'Bench Press', type: 'reps', loadMode: 'external', targetSets: 3, targetReps: 5, targetWeight: 30, restSeconds: 120 },
    { id: 'starter-row', name: 'Barbell Row', type: 'reps', loadMode: 'external', targetSets: 3, targetReps: 8, targetWeight: 30, restSeconds: 90 },
    { id: 'starter-plank', name: 'Plank', type: 'timer', targetSets: 2, targetDurationSeconds: 45, restSeconds: 60 },
  ],
}];

export type Section = 'templates' | 'logs' | 'profile';

export interface LoadedData {
  templates: WorkoutTemplate[];
  logs: WorkoutLog[];
  profile: UserProfile;
  // Sections whose stored value exists but could not be read. Writing them would destroy that value, so the app must not.
  blocked: Section[];
  // The raw values that could not be read, left untouched on disk and included in exports so they can be recovered.
  unreadable: Record<string, string>;
}

type Read = { state: 'missing' } | { state: 'ok'; value: unknown } | { state: 'bad'; raw: string };
const read = (raw: string | null): Read => {
  if (raw === null) return { state: 'missing' };
  if (raw.length > MAX_STORED_CHARACTERS) return { state: 'bad', raw };
  try { return { state: 'ok', value: JSON.parse(raw) as unknown }; } catch { return { state: 'bad', raw }; }
};

const chunks = <T,>(items: readonly T[], size = BATCH): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

const byStart = (a: WorkoutLog, b: WorkoutLog) => a.startTime - b.startTime;

// Old layout: every session in one value. Ids are derived deterministically (duplicates and missing ids included),
// so a move interrupted part-way and run again skips exactly the sessions it already wrote.
const legacySessions = (value: unknown[], written: Set<string>): WorkoutLog[] => {
  const seen = new Map<string, number>();
  return value.slice(-MAX_LOGS).flatMap((item, index) => {
    const log = sanitizeLog(item);
    if (!log) return [];
    const base = isRecord(item) && typeof item.id === 'string' && item.id ? log.id : `legacy-${index}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const id = n === 1 ? base : `${base}~${n}`;
    return written.has(id) ? [] : [{ ...log, id }];
  });
};

// The old value is removed only once every session is written, so a crash part-way leaves it in place
// and the next launch simply runs the move again.
const migrateLegacyLogs = async (store: KeyValueStore, logs: WorkoutLog[]) => {
  for (const batch of chunks(logs)) await store.multiSet(batch.map(log => [logKey(log.id), JSON.stringify(log)] as const));
  await store.removeItem(KEYS.legacyLogs);
};

export const loadAll = async (store: KeyValueStore): Promise<LoadedData> => {
  const blocked: Section[] = [];
  const unreadable: Record<string, string> = {};
  const [[, rawTemplates], [, rawProfile], [, rawLegacy]] = await store.multiGet([KEYS.templates, KEYS.profile, KEYS.legacyLogs]);

  let templates: WorkoutTemplate[] = [];
  const t = read(rawTemplates);
  if (t.state === 'missing') templates = STARTER_TEMPLATES;
  else if (t.state === 'ok' && Array.isArray(t.value)) templates = t.value.slice(0, MAX_TEMPLATES).map(sanitizeTemplate).filter((item): item is WorkoutTemplate => item !== null);
  else { blocked.push('templates'); unreadable[KEYS.templates] = rawTemplates ?? ''; }

  let profile: UserProfile = { weightLogs: [], height: 0 };
  const p = read(rawProfile);
  if (p.state === 'ok' && isRecord(p.value)) profile = sanitizeProfile(p.value);
  else if (p.state !== 'missing') { blocked.push('profile'); unreadable[KEYS.profile] = rawProfile ?? ''; }

  // Each session has its own key, so an unreadable one is set aside without touching the rest, and never rewritten.
  const keys = (await store.getAllKeys()).filter(key => key.startsWith(LOG_PREFIX));
  const logs: WorkoutLog[] = [];
  for (const batch of chunks(keys)) {
    for (const [key, raw] of await store.multiGet(batch)) {
      const r = read(raw);
      const log = r.state === 'ok' ? sanitizeLog(r.value) : null;
      if (log) logs.push({ ...log, id: key.slice(LOG_PREFIX.length) });
      else if (raw !== null) unreadable[key] = raw;
    }
  }

  const legacy = read(rawLegacy);
  if (legacy.state === 'ok' && Array.isArray(legacy.value)) {
    const moved = legacySessions(legacy.value, new Set(keys.map(key => key.slice(LOG_PREFIX.length))));
    logs.push(...moved);
    // A failed move keeps the old value, and new sessions still get their own keys, so the next launch just retries.
    try { await migrateLegacyLogs(store, moved); } catch { /* retried next launch */ }
  } else if (rawLegacy !== null) unreadable[KEYS.legacyLogs] = rawLegacy;

  return { templates, logs: logs.sort(byStart).slice(-MAX_LOGS), profile, blocked, unreadable };
};

export const writeTemplates = (store: KeyValueStore, templates: WorkoutTemplate[]) => store.setItem(KEYS.templates, JSON.stringify(templates));
export const writeProfile = (store: KeyValueStore, profile: UserProfile) => store.setItem(KEYS.profile, JSON.stringify(profile));
export const writeLog = (store: KeyValueStore, log: WorkoutLog) => store.setItem(logKey(log.id), JSON.stringify(log));
export const removeLogs = (store: KeyValueStore, ids: string[]) => (ids.length ? store.multiRemove(ids.map(logKey)) : Promise.resolve());
