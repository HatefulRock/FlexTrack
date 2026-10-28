import { describe, expect, it } from 'vitest';
import { KEYS, KeyValueStore, loadAll, logKey, STARTER_TEMPLATES, writeLog } from '../utils/storage';

const memoryStore = (initial: Record<string, string> = {}, failSetAfter = Infinity) => {
  const data = new Map(Object.entries(initial));
  let sets = 0;
  const set = (key: string, value: string) => {
    if (++sets > failSetAfter) throw new Error('disk full');
    data.set(key, value);
  };
  const store: KeyValueStore = {
    getItem: async key => data.get(key) ?? null,
    setItem: async (key, value) => set(key, value),
    removeItem: async key => { data.delete(key); },
    getAllKeys: async () => [...data.keys()],
    multiGet: async keys => keys.map(key => [key, data.get(key) ?? null] as const),
    multiSet: async pairs => pairs.forEach(([key, value]) => set(key, value)),
    multiRemove: async keys => keys.forEach(key => data.delete(key)),
  };
  return { store, data };
};

const session = (id: string, startTime: number) => ({ id, templateName: 'Push', source: 'routine', startTime, endTime: startTime + 60_000, exercises: [] });

describe('loadAll', () => {
  it('starts a fresh install with the starter routine and nothing blocked', async () => {
    const { store } = memoryStore();
    const data = await loadAll(store);
    expect(data.templates).toEqual(STARTER_TEMPLATES);
    expect(data.logs).toEqual([]);
    expect(data.blocked).toEqual([]);
    expect(data.unreadable).toEqual({});
  });

  it('never treats a corrupt value as empty: it is blocked from writes and kept for export', async () => {
    const { store, data } = memoryStore({ [KEYS.templates]: '[{"id":', [KEYS.profile]: 'nope', [KEYS.legacyLogs]: '{broken' });
    const loaded = await loadAll(store);
    expect(loaded.templates).toEqual([]);
    expect(loaded.blocked).toEqual(['templates', 'profile']);
    expect(loaded.unreadable).toEqual({ [KEYS.templates]: '[{"id":', [KEYS.profile]: 'nope', [KEYS.legacyLogs]: '{broken' });
    expect(data.get(KEYS.legacyLogs)).toBe('{broken');
  });

  it('moves the old single-value history into one key per session', async () => {
    const legacy = [session('a', 2), session('b', 1), session('a', 3), { ...session('', 4), id: undefined }];
    const { store, data } = memoryStore({ [KEYS.legacyLogs]: JSON.stringify(legacy) });
    const loaded = await loadAll(store);
    expect(loaded.logs.map(log => log.id)).toEqual(['b', 'a', 'a~2', 'legacy-3']);
    expect(data.has(KEYS.legacyLogs)).toBe(false);
    expect(JSON.parse(data.get(logKey('b'))!).startTime).toBe(1);
    expect((await loadAll(store)).logs.map(log => log.id)).toEqual(['b', 'a', 'a~2', 'legacy-3']);
  });

  it('resumes an interrupted move without duplicating sessions', async () => {
    const legacy = JSON.stringify([session('a', 1), session('b', 2), session('c', 3)]);
    const { store, data } = memoryStore({ [KEYS.legacyLogs]: legacy }, 0);
    const first = await loadAll(store);
    expect(first.logs).toHaveLength(3);
    expect(data.get(KEYS.legacyLogs)).toBe(legacy);
    data.set(logKey('a'), JSON.stringify(session('a', 1)));
    const { store: retry } = memoryStore(Object.fromEntries(data));
    const second = await loadAll(retry);
    expect(second.logs.map(log => log.id)).toEqual(['a', 'b', 'c']);
  });

  it('sets one unreadable session aside and loads the rest', async () => {
    const { store } = memoryStore({ [logKey('ok')]: JSON.stringify(session('ok', 1)), [logKey('bad')]: '{' });
    const loaded = await loadAll(store);
    expect(loaded.logs.map(log => log.id)).toEqual(['ok']);
    expect(loaded.blocked).toEqual([]);
    expect(loaded.unreadable).toEqual({ [logKey('bad')]: '{' });
  });

  it('writes a new session under its own key only', async () => {
    const { store, data } = memoryStore({ [logKey('old')]: JSON.stringify(session('old', 1)) });
    const before = data.get(logKey('old'));
    await writeLog(store, { ...session('new', 2), source: 'routine', exercises: [] });
    expect(data.get(logKey('old'))).toBe(before);
    expect((await loadAll(store)).logs.map(log => log.id)).toEqual(['old', 'new']);
  });
});
