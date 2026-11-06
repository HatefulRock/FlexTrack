import { describe, expect, it } from 'vitest';
import { buildExport } from '../utils/exportData';
import { describePlan, ImportError, ImportedData, isEmptyPlan, MAX_IMPORT_CHARACTERS, parseImport, planImport } from '../utils/importData';
import { MAX_LOGS, MAX_TEMPLATES } from '../utils/sanitize';
import { UserProfile, WorkoutLog, WorkoutTemplate } from '../types';

const template = (id: string, name = id): WorkoutTemplate => ({ id, name, exercises: [], scheduleDays: [] });
const session = (id: string, startTime: number): WorkoutLog => ({ id, templateName: 'Push', source: 'routine', startTime, endTime: startTime + 60_000, exercises: [] });
const data = (templates: WorkoutTemplate[] = [], logs: WorkoutLog[] = [], profile: UserProfile = { weightLogs: [], height: 0 }): ImportedData => ({ templates, logs, profile });
const problem = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof ImportError ? error.problem : 'other'; } return 'none'; };

describe('parseImport', () => {
  it('reads back exactly what an export wrote', () => {
    const templates = [{ ...template('t1', 'Push'), color: 'red' as const, scheduleDays: [1, 4] }];
    const logs = [session('l1', 1_700_000_000_000)];
    const profile = { height: 180, weightLogs: [{ date: 1_700_000_000_000, weight: 80 }] };
    const parsed = parseImport(JSON.stringify(buildExport(templates, logs, profile)));
    expect(parsed.templates).toEqual([expect.objectContaining({ id: 't1', name: 'Push', color: 'red', scheduleDays: [1, 4] })]);
    expect(parsed.logs).toEqual([expect.objectContaining({ id: 'l1', startTime: 1_700_000_000_000 })]);
    expect(parsed.profile).toEqual(profile);
  });

  it('rejects files that are not a FlexTrack export, saying why', () => {
    expect(problem(() => parseImport('{not json'))).toBe('not-json');
    expect(problem(() => parseImport('[1, 2]'))).toBe('not-flextrack');
    expect(problem(() => parseImport(JSON.stringify({ app: 'Other', format: 1 })))).toBe('not-flextrack');
    expect(problem(() => parseImport(JSON.stringify({ app: 'FlexTrack' })))).toBe('not-flextrack');
    expect(problem(() => parseImport(JSON.stringify({ app: 'FlexTrack', format: 2 })))).toBe('newer-format');
    expect(problem(() => parseImport(' '.repeat(MAX_IMPORT_CHARACTERS + 1)))).toBe('too-large');
  });

  it('validates every item like stored data, dropping what cannot be used', () => {
    const parsed = parseImport(JSON.stringify({
      app: 'FlexTrack', format: 1,
      templates: [template('ok'), 'junk', null],
      logs: [session('ok', 5), { id: 'no-start' }, 7],
      profile: { height: 9999, weightLogs: [{ date: 1, weight: 80 }, { date: 2 }] },
    }));
    expect(parsed.templates.map(t => t.id)).toEqual(['ok']);
    expect(parsed.logs.map(l => l.id)).toEqual(['ok']);
    expect(parsed.profile).toEqual({ height: 300, weightLogs: [{ date: 1, weight: 80 }] });
  });

  it('treats missing sections as empty', () => {
    expect(parseImport(JSON.stringify({ app: 'FlexTrack', format: 1 }))).toEqual(data());
  });
});

describe('planImport', () => {
  it('adds everything to an empty device', () => {
    const backup = data([template('a'), template('b')], [session('x', 1), session('y', 2)], { height: 175, weightLogs: [{ date: 1, weight: 70 }] });
    const plan = planImport(data(), backup);
    expect(plan).toEqual({ templates: backup.templates, logs: backup.logs, weightLogs: backup.profile.weightLogs, height: 175, skipped: 0 });
    expect(describePlan(plan)).toBe('2 workouts, 2 sessions, 1 weight entry and your height');
  });

  it('never replaces or duplicates what the device already has', () => {
    const device = data([template('a', 'Push (edited)')], [session('x', 1)], { height: 180, weightLogs: [{ date: 1, weight: 81 }] });
    const backup = data([template('a', 'Push'), template('b')], [session('x', 1), session('y', 2)], { height: 175, weightLogs: [{ date: 1, weight: 70 }, { date: 2, weight: 71 }] });
    const plan = planImport(device, backup);
    expect(plan.templates.map(t => t.id)).toEqual(['b']);
    expect(plan.logs.map(l => l.id)).toEqual(['y']);
    expect(plan.weightLogs).toEqual([{ date: 2, weight: 71 }]);
    expect(plan.height).toBeUndefined();
    expect(plan.skipped).toBe(4);
  });

  it('adds nothing when the same backup is restored twice', () => {
    const backup = data([template('a')], [session('x', 1)], { height: 175, weightLogs: [{ date: 1, weight: 70 }] });
    const plan = planImport(backup, backup);
    expect(isEmptyPlan(plan)).toBe(true);
    expect(describePlan(plan)).toBe('nothing');
  });

  it('takes the first of any duplicate ids inside the backup itself', () => {
    const plan = planImport(data(), data([template('a', 'First'), template('a', 'Second')], [session('x', 1), session('x', 2)]));
    expect(plan.templates.map(t => t.name)).toEqual(['First']);
    expect(plan.logs.map(l => l.startTime)).toEqual([1]);
  });

  it('stays within the storage limits, keeping the newest sessions', () => {
    const device = data(Array.from({ length: MAX_TEMPLATES - 1 }, (_, i) => template(`d${i}`)), Array.from({ length: MAX_LOGS }, (_, i) => session(`d${i}`, 1_000 + i)));
    const plan = planImport(device, data([template('n1'), template('n2')], [session('old', 1), session('new', 1_000_000)]));
    expect(plan.templates.map(t => t.id)).toEqual(['n1']);
    expect(plan.logs.map(l => l.id)).toEqual(['new']);
  });
});
