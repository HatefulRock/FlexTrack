import { Exercise, WorkoutLog, WorkoutTemplate } from '../types';
import { formatDecimal } from './training';
import { buildWidgetSnapshot, WidgetSnapshot } from './widgetData';

// What the Apple Watch and Wear OS apps receive: the widget snapshot plus each scheduled routine's
// exercises, already formatted, so the watch code only picks today's routine and lists it.
export interface WatchSnapshot extends WidgetSnapshot {
  routines: { name: string; days: number[]; items: { name: string; detail: string }[] }[];
}

const MAX_ROUTINES = 30, MAX_ITEMS = 40;

export const exerciseDetail = (e: Exercise) => {
  const sets = e.targetSets || 1;
  if (e.type === 'timer') return `${sets} × ${e.targetDurationSeconds || 0} s`;
  if (e.type === 'distance') return `${formatDecimal(e.targetDistance || 0)} ${e.targetDistanceUnit === 'miles' ? 'mi' : e.targetDistanceUnit || 'km'}`;
  const reps = `${sets} × ${e.targetReps || 0}`;
  if (e.loadMode === 'bodyweight') return `${reps} · bodyweight`;
  if (!e.targetWeight) return reps;
  return `${reps} · ${formatDecimal(e.targetWeight)} kg${e.loadMode === 'assisted' ? ' assist' : ''}`;
};

export const buildWatchSnapshot = (templates: WorkoutTemplate[], logs: WorkoutLog[]): WatchSnapshot => ({
  ...buildWidgetSnapshot(templates, logs),
  routines: templates.filter(t => t.scheduleDays?.length).slice(0, MAX_ROUTINES).map(t => ({
    name: t.name, days: t.scheduleDays ?? [],
    items: t.exercises.slice(0, MAX_ITEMS).map(e => ({ name: e.name, detail: exerciseDetail(e) })),
  })),
});
