import { describe, expect, it } from 'vitest';
import { WorkoutLog, WorkoutTemplate } from '../types';
import { CARDIO_COLOR, WORKOUT_COLORS, colorKeyOf, defaultColorKey, hexOf, logColor, nextColorKey } from '../utils/workoutColor';
import { sanitizeLog, sanitizeTemplate } from '../utils/sanitize';

const t = (id: string, color?: string): WorkoutTemplate => ({ id, name: id, exercises: [], color });
const log = (extra: Partial<WorkoutLog>): WorkoutLog => ({ id: 'l', templateName: 'x', startTime: 1, exercises: [], ...extra });

describe('workout colours', () => {
  it('uses the chosen colour, and a stable non-chalk default otherwise', () => {
    expect(colorKeyOf(t('a', 'purple'))).toBe('purple');
    expect(colorKeyOf(t('a', 'nonsense'))).toBe(defaultColorKey('a'));
    expect(defaultColorKey('same-id')).toBe(defaultColorKey('same-id'));
    expect(['x', 'y', 'z', 'abc', 'starter'].map(defaultColorKey)).not.toContain('chalk');
  });

  it('gives a new workout a colour no other workout uses yet', () => {
    expect(nextColorKey([])).toBe('red');
    expect(nextColorKey([t('a', 'red'), t('b', 'orange')])).toBe('green');
    const all = WORKOUT_COLORS.map((c, i) => t(String(i), c.key));
    expect(WORKOUT_COLORS.map(c => c.key)).toContain(nextColorKey(all));
  });

  it('colours a session by its workout, then by what it was logged with once deleted, then grey for quick cardio', () => {
    expect(logColor(log({ color: 'teal', templateId: 'a' }), [t('a', 'red')])).toBe(hexOf('red'));
    expect(logColor(log({ color: 'teal', templateId: 'gone' }), [t('a', 'red')])).toBe(hexOf('teal'));
    expect(logColor(log({ templateId: 'a' }), [t('a', 'red')])).toBe(hexOf('red'));
    expect(logColor(log({ source: 'quick', activityCategory: 'run' }))).toBe(CARDIO_COLOR);
  });

  it('keeps a valid colour through storage and drops an unknown one', () => {
    expect(sanitizeTemplate({ id: 'a', name: 'A', color: 'pink' })?.color).toBe('pink');
    expect(sanitizeTemplate({ id: 'a', name: 'A', color: '#123456' })?.color).toBeUndefined();
    expect(sanitizeLog({ id: 'l', startTime: 5, color: 'blue' })?.color).toBe('blue');
  });
});

describe('workout heat grid', () => {
  it('gives each workout a row in its colour, keeps cardio separate, and labels by the current name', async () => {
    const { workoutHeat } = await import('../pages/Stats/workoutHeat');
    const now = new Date(2026, 10, 4);
    const set = { setNumber: 1, completed: true };
    const ex = (n: number) => [{ exerciseId: 'e', exerciseName: 'Squat', completed: true, sets: Array.from({ length: n }, () => set) }];
    const logs: WorkoutLog[] = [
      log({ id: '1', templateId: 'a', templateName: 'Old name', startTime: now.getTime() - 86_400_000, exercises: ex(3) }),
      log({ id: '2', templateId: 'a', templateName: 'Legs', startTime: now.getTime(), exercises: ex(2) }),
      log({ id: '3', source: 'quick', activityCategory: 'run', templateName: 'Run', startTime: now.getTime() }),
    ];
    const { rows } = workoutHeat(logs, [t('a', 'purple')], 4, now);
    expect(rows.map(r => r.label)).toEqual(['a', 'Cardio']);
    expect(rows[0].color).toBe(hexOf('purple'));
    expect(rows[0].values.at(-1)).toBe(5);
    expect(rows[1].color).toBe(CARDIO_COLOR);
  });
});
