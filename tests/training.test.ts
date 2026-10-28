import { describe, expect, it } from 'vitest';
import { currentStreak, detectRecords, formatDuration, logVolume, platesPerSide } from '../utils/training';
import { WorkoutLog } from '../types';

const log = (id: string, day: Date, weight: number, reps: number, over: Partial<WorkoutLog['exercises'][number]> = {}): WorkoutLog => ({
  id, templateName: 'A', startTime: day.getTime(), endTime: day.getTime() + 3_600_000,
  exercises: [{ exerciseId: 'bench', exerciseName: 'Bench Press', completed: true, sets: [{ setNumber: 1, weight, reps, completed: true }], ...over }],
});
const daysAgo = (n: number, now = new Date(2026, 9, 28, 12)) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };

describe('platesPerSide', () => {
  it('loads heaviest plates first', () => {
    expect(platesPerSide(87.5)).toEqual({ plates: [25, 5, 2.5, 1.25], remainder: 0 });
  });
  it('reports weight that cannot be loaded', () => {
    expect(platesPerSide(21)).toEqual({ plates: [], remainder: 0.5 });
    expect(platesPerSide(10)).toEqual({ plates: [], remainder: 0 });
  });
});

describe('formatDuration', () => {
  it('formats seconds, minutes and hours', () => {
    expect(formatDuration(20_000)).toBe('20s');
    expect(formatDuration(25 * 60_000)).toBe('25m');
    expect(formatDuration(65 * 60_000)).toBe('1h 05m');
  });
});

describe('logVolume', () => {
  it('ignores assisted sets', () => {
    expect(logVolume(log('a', daysAgo(0), 100, 5))).toBe(500);
    expect(logVolume(log('a', daysAgo(0), 100, 5, { loadMode: 'assisted' }))).toBe(0);
  });
});

describe('currentStreak', () => {
  const now = daysAgo(0);
  it('counts consecutive days and survives an untrained today', () => {
    expect(currentStreak([log('a', daysAgo(1), 1, 1), log('b', daysAgo(2), 1, 1)], now)).toBe(2);
    expect(currentStreak([log('a', daysAgo(0), 1, 1), log('b', daysAgo(1), 1, 1)], now)).toBe(2);
  });
  it('breaks on a missed day', () => {
    expect(currentStreak([log('a', daysAgo(2), 1, 1)], now)).toBe(0);
  });
});

describe('detectRecords', () => {
  it('flags a heavier top set', () => {
    const hits = detectRecords(log('new', daysAgo(0), 105, 3), [log('old', daysAgo(3), 100, 5)]);
    expect(hits).toEqual([{ exerciseName: 'Bench Press', kind: 'weight', value: 105, previous: 100 }]);
  });
  it('flags an estimated 1RM gain at the same weight', () => {
    expect(detectRecords(log('new', daysAgo(0), 100, 8), [log('old', daysAgo(3), 100, 5)])[0]?.kind).toBe('oneRM');
  });
  it('needs prior history to call a record', () => {
    expect(detectRecords(log('new', daysAgo(0), 105, 3), [])).toEqual([]);
  });
});
