import { WorkoutLog, WorkoutTemplate } from '../types';

// Colours a lifter picks for a workout. Red, blue and green are the calibrated plate hues the app grew up with;
// yellow stays out because it is reserved for personal records.
export const WORKOUT_COLORS = [
  { key: 'red', label: 'Red', hex: '#D2232A' },
  { key: 'orange', label: 'Orange', hex: '#E8772E' },
  { key: 'green', label: 'Green', hex: '#1E9B4B' },
  { key: 'teal', label: 'Teal', hex: '#139E94' },
  { key: 'blue', label: 'Blue', hex: '#1E5BC6' },
  { key: 'purple', label: 'Purple', hex: '#8A4FD1' },
  { key: 'pink', label: 'Pink', hex: '#D6409F' },
  { key: 'chalk', label: 'Chalk', hex: '#D9D8D2' },
] as const;
export type WorkoutColorKey = typeof WORKOUT_COLORS[number]['key'];

// Runs, walks and rides logged outside a workout.
export const CARDIO_COLOR = '#B9BDC1';
export const NEUTRAL_COLOR = '#5A5E62';

export const isWorkoutColor = (value: unknown): value is WorkoutColorKey => WORKOUT_COLORS.some(c => c.key === value);

// A workout without a chosen colour still gets a stable one, picked from its id, so older workouts are coloured too.
export const defaultColorKey = (id: string): WorkoutColorKey => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return WORKOUT_COLORS[Math.abs(h) % (WORKOUT_COLORS.length - 1)].key; // chalk is only ever chosen on purpose
};

// The first colour not already used by another workout, so a new workout stands apart from the rest.
export const nextColorKey = (templates: WorkoutTemplate[]): WorkoutColorKey => {
  const used = new Set(templates.map(colorKeyOf));
  return WORKOUT_COLORS.find(c => !used.has(c.key))?.key ?? WORKOUT_COLORS[templates.length % WORKOUT_COLORS.length].key;
};

export const colorKeyOf = (t: Pick<WorkoutTemplate, 'id' | 'color'>): WorkoutColorKey => (isWorkoutColor(t.color) ? t.color : defaultColorKey(t.id));
export const hexOf = (key: WorkoutColorKey) => WORKOUT_COLORS.find(c => c.key === key)!.hex;
export const workoutColor = (t: Pick<WorkoutTemplate, 'id' | 'color'>) => hexOf(colorKeyOf(t));

// A logged session keeps the colour its workout had; older logs borrow the workout's current colour, and quick logs are cardio grey.
export const logColor = (log: WorkoutLog, templates: WorkoutTemplate[] = []) => {
  if (isWorkoutColor(log.color)) return hexOf(log.color);
  const template = log.templateId ? templates.find(t => t.id === log.templateId) : undefined;
  if (template) return workoutColor(template);
  if (log.source === 'quick') return log.activityCategory === 'strength' || log.activityCategory === 'timed' || log.activityCategory === 'other' ? NEUTRAL_COLOR : CARDIO_COLOR;
  return log.templateId ? hexOf(defaultColorKey(log.templateId)) : NEUTRAL_COLOR;
};
