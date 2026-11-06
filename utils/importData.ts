import { UserProfile, WorkoutLog, WorkoutTemplate } from '../types';
import { isRecord, MAX_LOGS, MAX_TEMPLATES, sanitizeLog, sanitizeProfile, sanitizeTemplate } from './sanitize';

// Reads back a file written by exportData. Import only ever adds: a workout, session or weight entry already on the
// device is never replaced or removed, so restoring an old backup over newer data cannot lose anything.

// Ten thousand long sessions stay well under this; anything bigger is not a FlexTrack export.
export const MAX_IMPORT_CHARACTERS = 50_000_000;

export type ImportProblem = 'too-large' | 'not-json' | 'not-flextrack' | 'newer-format';
export class ImportError extends Error {
  constructor(readonly problem: ImportProblem) { super(problem); }
}

export interface ImportedData { templates: WorkoutTemplate[]; logs: WorkoutLog[]; profile: UserProfile }

export const parseImport = (json: string): ImportedData => {
  if (json.length > MAX_IMPORT_CHARACTERS) throw new ImportError('too-large');
  let value: unknown;
  try { value = JSON.parse(json); } catch { throw new ImportError('not-json'); }
  if (!isRecord(value) || value.app !== 'FlexTrack') throw new ImportError('not-flextrack');
  if (typeof value.format !== 'number' || value.format > 1) throw new ImportError(typeof value.format === 'number' ? 'newer-format' : 'not-flextrack');
  // The same validation as stored data: a backup is no more trusted than the device's own storage.
  const templates = Array.isArray(value.templates)
    ? value.templates.slice(0, MAX_TEMPLATES).map(sanitizeTemplate).filter((item): item is WorkoutTemplate => item !== null) : [];
  const logs = Array.isArray(value.logs)
    ? value.logs.slice(-MAX_LOGS).map(sanitizeLog).filter((item): item is WorkoutLog => item !== null) : [];
  return { templates, logs, profile: sanitizeProfile(value.profile) };
};

export interface ImportPlan {
  templates: WorkoutTemplate[];   // workouts to add, none sharing an id with one on the device
  logs: WorkoutLog[];             // sessions to add, none sharing an id with one on the device
  weightLogs: UserProfile['weightLogs']; // weight entries at times the device has none for
  height?: number;                // only when the device has no height yet
  skipped: number;                // items already on the device, or over the storage limits
}

const firstById = <T extends { id: string }>(items: T[], taken: Set<string>) => items.filter(item => {
  if (taken.has(item.id)) return false;
  taken.add(item.id);
  return true;
});

export const planImport = (current: ImportedData, incoming: ImportedData): ImportPlan => {
  const newTemplates = firstById(incoming.templates, new Set(current.templates.map(t => t.id)));
  const templates = newTemplates.slice(0, Math.max(0, MAX_TEMPLATES - current.templates.length));

  // Over the session cap the oldest go first, as when logging a new session. A backup session older than everything
  // kept would be written and dropped straight away, so it is left out of the plan instead.
  const newLogs = firstById(incoming.logs, new Set(current.logs.map(l => l.id)));
  const kept = new Set([...current.logs, ...newLogs].sort((a, b) => a.startTime - b.startTime).slice(-MAX_LOGS));
  const logs = newLogs.filter(log => kept.has(log));

  const dates = new Set(current.profile.weightLogs.map(entry => entry.date));
  const weightLogs = incoming.profile.weightLogs.filter(entry => !dates.has(entry.date) && (dates.add(entry.date), true));
  const height = !current.profile.height && incoming.profile.height ? incoming.profile.height : undefined;

  const offered = incoming.templates.length + incoming.logs.length + incoming.profile.weightLogs.length + (incoming.profile.height ? 1 : 0);
  const added = templates.length + logs.length + weightLogs.length + (height ? 1 : 0);
  return { templates, logs, weightLogs, height, skipped: offered - added };
};

export const isEmptyPlan = (plan: ImportPlan) => !plan.templates.length && !plan.logs.length && !plan.weightLogs.length && !plan.height;

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// "2 workouts, 41 sessions and 6 weight entries"
export const describePlan = (plan: ImportPlan) => {
  const parts = [
    plan.templates.length && count(plan.templates.length, 'workout', 'workouts'),
    plan.logs.length && count(plan.logs.length, 'session', 'sessions'),
    plan.weightLogs.length && count(plan.weightLogs.length, 'weight entry', 'weight entries'),
    plan.height && 'your height',
  ].filter((part): part is string => !!part);
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0] ?? 'nothing';
};

export const importProblemMessage = (problem: ImportProblem) => ({
  'too-large': 'This file is too large to be a FlexTrack backup.',
  'not-json': 'This file isn’t a FlexTrack backup. Pick the .json file you exported from History.',
  'not-flextrack': 'This file isn’t a FlexTrack backup. Pick the .json file you exported from History.',
  'newer-format': 'This backup was made by a newer version of FlexTrack. Update the app, then import it again.',
})[problem];
