import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { WorkoutLog, WorkoutTemplate } from '../types';

// What the home-screen widgets read. It holds raw days rather than a finished label so a widget
// that wakes up after midnight can still show the right streak and the right next workout.
export interface WidgetSnapshot {
  lastDay: string | null; // yyyy-MM-dd of the latest session
  streakAtLastDay: number; // consecutive training days ending on lastDay
  schedule: { name: string; days: number[]; exercises: number }[];
}

export interface WidgetView {
  streak: number;
  trainedToday: boolean;
  next: { name: string; when: string; exercises: number } | null;
}

const dayKey = (date: Date) => format(date, 'yyyy-MM-dd');
const MAX_ROUTINES = 30;

export const buildWidgetSnapshot = (templates: WorkoutTemplate[], logs: WorkoutLog[]): WidgetSnapshot => {
  const days = new Set(logs.map(l => dayKey(new Date(l.startTime))));
  const lastDay = [...days].sort().pop() ?? null;
  let streakAtLastDay = 0;
  if (lastDay) for (let day = parseISO(lastDay); days.has(dayKey(day)); day = addDays(day, -1)) streakAtLastDay++;
  const schedule = templates.filter(t => t.scheduleDays?.length).slice(0, MAX_ROUTINES)
    .map(t => ({ name: t.name, days: t.scheduleDays ?? [], exercises: t.exercises.length }));
  return { lastDay, streakAtLastDay, schedule };
};

// Mirrors currentStreak: training yesterday keeps the streak alive until the end of today.
// The iOS widget repeats this logic in Swift (targets/widget/FlexTrackWidget.swift).
export const widgetView = (snapshot: WidgetSnapshot, now = new Date()): WidgetView => {
  const gap = snapshot.lastDay ? differenceInCalendarDays(now, parseISO(snapshot.lastDay)) : Infinity;
  const trainedToday = gap === 0;
  const streak = gap <= 1 ? snapshot.streakAtLastDay : 0;
  // Today's routine counts until it is done; after that the widget looks ahead.
  for (let offset = trainedToday ? 1 : 0; offset <= 7; offset++) {
    const date = addDays(now, offset), routine = snapshot.schedule.find(r => r.days.includes(date.getDay()));
    if (!routine) continue;
    const when = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : format(date, 'EEEE');
    return { streak, trainedToday, next: { name: routine.name, when, exercises: routine.exercises } };
  }
  return { streak, trainedToday, next: null };
};
