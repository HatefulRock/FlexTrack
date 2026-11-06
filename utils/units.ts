import { formatDecimal, formatNumber } from './training';

// Every weight is stored in kilograms; the lifter's unit only changes what is shown and typed. Values typed in pounds
// are stored unrounded, so they read back exactly as typed. The unit is app-wide state that changes rarely: App
// remounts the screens when it does, so render code can read it directly.

export type WeightUnit = 'kg' | 'lb';
export const LB_PER_KG = 2.20462262185;

let current: WeightUnit = 'kg';
const listeners = new Set<() => void>();
export const getWeightUnit = () => current;
export const setWeightUnit = (unit: WeightUnit) => {
  if (unit === current) return;
  current = unit;
  listeners.forEach(listener => listener());
};
export const subscribeWeightUnit = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

export const isWeightUnit = (value: unknown): value is WeightUnit => value === 'kg' || value === 'lb';

// Pounds where gyms load in pounds: the United States, Liberia and Myanmar. Only used to pick a new install's default.
export const unitForLocale = (locale: string | undefined): WeightUnit => /[-_](US|LR|MM)\b/i.test(locale ?? '') ? 'lb' : 'kg';

export const toUnit = (kg: number, unit = current) => (unit === 'lb' ? kg * LB_PER_KG : kg);
export const fromUnit = (value: number, unit = current) => (unit === 'lb' ? value / LB_PER_KG : value);

// "135", "61.25": a weight as a number in the unit, up to two decimals.
export const weightNumber = (kg: number, unit = current) => formatDecimal(toUnit(kg, unit));
// "135 lb", "61.25 kg".
export const formatWeight = (kg: number, unit = current) => `${weightNumber(kg, unit)} ${unit}`;
// "12,450": whole numbers for totals such as volume.
export const weightTotal = (kg: number, unit = current) => formatNumber(toUnit(kg, unit));
export const unitWord = (unit = current) => (unit === 'lb' ? 'pounds' : 'kilograms');

// The smallest jump a gym usually loads: a pair of the smallest common plates.
export const WEIGHT_STEP: Record<WeightUnit, number> = { kg: 2.5, lb: 5 };
export const weightStep = (unit = current) => WEIGHT_STEP[unit];

// Adds a step in the lifter's unit and rounds there, so 135 lb + 5 is exactly 140 lb when shown again.
export const addInUnit = (kg: number, step: number, unit = current) => fromUnit(Math.max(0, Math.round((toUnit(kg, unit) + step) * 100) / 100), unit);

// A standard bar and the plates a gym stocks, heaviest first.
export const BAR: Record<WeightUnit, number> = { kg: 20, lb: 45 };
export const PLATES: Record<WeightUnit, readonly number[]> = { kg: [25, 20, 15, 10, 5, 2.5, 1.25], lb: [45, 35, 25, 10, 5, 2.5] };

// The weight as a stepper or input shows it: rounded to hundredths in the unit, so a weight typed as 45 lb is
// exactly 45 again (and exactly the bar) however the kilograms round.
export const shownWeight = (kg: number, unit = current) => Math.round(toUnit(kg, unit) * 100) / 100;

// How a weight sits against a standard bar: more than the bar (draw the plates), exactly the bar, or lighter.
export const barLoad = (kg = 0, unit = current): 'loaded' | 'bar' | 'light' => {
  const w = shownWeight(kg, unit);
  return w > BAR[unit] ? 'loaded' : w === BAR[unit] ? 'bar' : 'light';
};

// Plates per side, heaviest first, all in the unit. `remainder` is what the stocked plates can't make up on each side.
export const platesPerSide = (kg: number, unit = current): { bar: number; perSide: number; plates: number[]; remainder: number } => {
  const perSide = Math.max(0, (shownWeight(kg, unit) - BAR[unit]) / 2);
  let left = perSide;
  const plates: number[] = [];
  PLATES[unit].forEach(p => { while (left + 1e-9 >= p) { plates.push(p); left -= p; } });
  return { bar: BAR[unit], perSide, plates, remainder: Math.round(left * 100) / 100 };
};
