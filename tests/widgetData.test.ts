import { describe, expect, it } from 'vitest';
import { WorkoutLog, WorkoutTemplate } from '../types';
import { buildWidgetSnapshot, widgetView } from '../utils/widgetData';

// Wednesday, October 28, 2026, mid-morning local time.
const now = new Date(2026, 9, 28, 10);
const at = (daysAgo: number): WorkoutLog => ({ id: `l${daysAgo}`, templateName: 'A', startTime: new Date(2026, 9, 28 - daysAgo, 8).getTime(), exercises: [] });
const routine = (name: string, scheduleDays: number[]): WorkoutTemplate => ({ id: name, name, scheduleDays, exercises: [{ id: 'e', name: 'Squat', type: 'reps' }] });

describe('widget snapshot', () => {
  it('counts the streak up to the latest session and keeps it alive through the next day', () => {
    const snapshot = buildWidgetSnapshot([], [at(1), at(2), at(3), at(5)]);
    expect(snapshot).toMatchObject({ lastDay: '2026-10-27', streakAtLastDay: 3 });
    expect(widgetView(snapshot, now)).toMatchObject({ streak: 3, trainedToday: false });
    expect(widgetView(snapshot, new Date(2026, 9, 29, 9)).streak).toBe(0);
  });

  it('shows today\'s routine until a session is logged today, then the next one', () => {
    const templates = [routine('Push', [3]), routine('Legs', [5])];
    expect(widgetView(buildWidgetSnapshot(templates, []), now).next).toEqual({ name: 'Push', when: 'Today', exercises: 1 });
    expect(widgetView(buildWidgetSnapshot(templates, [at(0)]), now)).toMatchObject({ trainedToday: true, streak: 1, next: { name: 'Legs', when: 'Friday' } });
    expect(widgetView(buildWidgetSnapshot([routine('Pull', [4])], [at(0)]), now).next?.when).toBe('Tomorrow');
  });

  it('has nothing to show without a schedule or history', () => {
    expect(widgetView(buildWidgetSnapshot([routine('Unscheduled', [])], []), now)).toEqual({ streak: 0, trainedToday: false, next: null });
  });
});
