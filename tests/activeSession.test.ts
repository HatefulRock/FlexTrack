import { beforeEach, describe, expect, it, vi } from 'vitest';

const data = new Map<string, string>();
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => data.get(key) ?? null,
    setItem: async (key: string, value: string) => { data.set(key, value); },
    removeItem: async (key: string) => { data.delete(key); },
  },
}));

const { loadActiveSession } = await import('../utils/activeSession');

const template = { id: 't', name: 'Push', scheduleDays: [], exercises: [{ id: 'e', name: 'Bench', type: 'reps', targetSets: 1, restSeconds: 60 }] };
const log = { exerciseId: 'e', exerciseName: 'Bench', sets: [{ setNumber: 1, reps: 5, weight: 60, completed: true }], completed: true };

describe('loadActiveSession', () => {
  beforeEach(() => data.clear());

  it('resumes a recent, well-formed session', async () => {
    data.set('active-session', JSON.stringify({ template, startTime: 1, activeExerciseIndex: 4, logs: [log], savedAt: Date.now() }));
    const session = await loadActiveSession();
    expect(session?.template.id).toBe('t');
    expect(session?.logs[0].sets[0].weight).toBe(60);
    expect(session?.activeExerciseIndex).toBe(0);
  });

  it('discards a malformed session instead of handing it to the dashboard', async () => {
    data.set('active-session', JSON.stringify({ template, startTime: 1, logs: [{ exerciseId: 'e', sets: 'oops' }, null], savedAt: Date.now() }));
    expect(await loadActiveSession()).toBeNull();
    data.set('active-session', JSON.stringify({ template, startTime: 1, logs: ['not a log'], savedAt: Date.now() }));
    expect(await loadActiveSession()).toBeNull();
    expect(data.has('active-session')).toBe(false);
  });

  it('discards corrupt JSON', async () => {
    data.set('active-session', '{');
    expect(await loadActiveSession()).toBeNull();
    expect(data.has('active-session')).toBe(false);
  });
});
