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

  it('colours a session by what it was logged with, then its workout, then grey for quick cardio', () => {
    expect(logColor(log({ color: 'teal', templateId: 'a' }), [t('a', 'red')])).toBe(hexOf('teal'));
    expect(logColor(log({ templateId: 'a' }), [t('a', 'red')])).toBe(hexOf('red'));
    expect(logColor(log({ source: 'quick', activityCategory: 'run' }))).toBe(CARDIO_COLOR);
  });

  it('keeps a valid colour through storage and drops an unknown one', () => {
    expect(sanitizeTemplate({ id: 'a', name: 'A', color: 'pink' })?.color).toBe('pink');
    expect(sanitizeTemplate({ id: 'a', name: 'A', color: '#123456' })?.color).toBeUndefined();
    expect(sanitizeLog({ id: 'l', startTime: 5, color: 'blue' })?.color).toBe('blue');
  });
});
