import { afterEach, describe, expect, it } from 'vitest';
import { addInUnit, barLoad, formatWeight, fromUnit, platesPerSide, setWeightUnit, shownWeight, toUnit, unitForLocale, weightTotal } from '../utils/units';
import { suggestProgression } from '../utils/progression';
import { exerciseDetail } from '../utils/watchData';
import { Exercise, ExerciseLog } from '../types';

afterEach(() => setWeightUnit('kg'));

describe('conversion', () => {
  it('reads a weight typed in pounds back exactly as typed', () => {
    for (const lb of [45, 135, 137.5, 225, 315.25]) {
      expect(shownWeight(fromUnit(lb, 'lb'), 'lb')).toBe(lb);
      expect(formatWeight(fromUnit(lb, 'lb'), 'lb')).toBe(`${lb} lb`);
    }
  });

  it('formats in the current unit', () => {
    expect(formatWeight(100)).toBe('100 kg');
    setWeightUnit('lb');
    expect(formatWeight(100)).toBe('220.46 lb');
    expect(weightTotal(1000)).toBe('2,205');
    expect(toUnit(1)).toBeCloseTo(2.20462, 5);
  });

  it('steps in the unit, so 135 lb + 5 shows exactly 140 lb', () => {
    expect(shownWeight(addInUnit(fromUnit(135, 'lb'), 5, 'lb'), 'lb')).toBe(140);
    expect(addInUnit(60, 2.5, 'kg')).toBe(62.5);
    expect(addInUnit(1.25, -2.5, 'kg')).toBe(0);
  });

  it('starts new installs in pounds only where gyms load in pounds', () => {
    expect(unitForLocale('en-US')).toBe('lb');
    expect(unitForLocale('es_US')).toBe('lb');
    expect(unitForLocale('en-GB')).toBe('kg');
    expect(unitForLocale('fr-FR')).toBe('kg');
    expect(unitForLocale('en')).toBe('kg');
    expect(unitForLocale(undefined)).toBe('kg');
  });
});

describe('platesPerSide', () => {
  it('loads kilogram plates heaviest first on a 20 kg bar', () => {
    expect(platesPerSide(87.5, 'kg')).toEqual({ bar: 20, perSide: 33.75, plates: [25, 5, 2.5, 1.25], remainder: 0 });
  });
  it('reports weight that cannot be loaded', () => {
    expect(platesPerSide(21, 'kg')).toMatchObject({ plates: [], remainder: 0.5 });
    expect(platesPerSide(10, 'kg')).toMatchObject({ plates: [], perSide: 0, remainder: 0 });
  });
  it('loads pound plates on a 45 lb bar', () => {
    expect(platesPerSide(fromUnit(225, 'lb'), 'lb')).toEqual({ bar: 45, perSide: 90, plates: [45, 45], remainder: 0 });
    expect(platesPerSide(fromUnit(185, 'lb'), 'lb')).toMatchObject({ plates: [45, 25], remainder: 0 });
    // 137.5 lb leaves 46.25 a side: a 45 and 1.25 lb that no stocked plate makes up.
    expect(platesPerSide(fromUnit(137.5, 'lb'), 'lb')).toMatchObject({ plates: [45], remainder: 1.25 });
  });
  it('treats a weight typed as exactly the bar as the bar', () => {
    expect(barLoad(fromUnit(45, 'lb'), 'lb')).toBe('bar');
    expect(barLoad(fromUnit(50, 'lb'), 'lb')).toBe('loaded');
    expect(barLoad(20, 'kg')).toBe('bar');
    expect(barLoad(15, 'kg')).toBe('light');
  });
});

describe('in pounds', () => {
  const exercise = (over: Partial<Exercise> = {}): Exercise => ({ id: 'e1', name: 'Bench Press', type: 'reps', loadMode: 'external', targetSets: 3, targetReps: 5, targetWeight: 60, restSeconds: 90, ...over });
  const last = (lb: number[]): ExerciseLog => ({ exerciseId: 'e1', exerciseName: 'Bench Press', completed: true, sets: lb.map((w, i) => ({ setNumber: i + 1, weight: fromUnit(w, 'lb'), reps: 5, completed: true })) });

  it('suggests +5 lb, a load that goes on the bar', () => {
    setWeightUnit('lb');
    const s = suggestProgression(exercise(), last([135, 135, 135]));
    expect(shownWeight(s!.weight!)).toBe(140);
    expect(s!.reason).toBe('You hit 3 × 5 at 135 lb last time');
  });

  it('takes 5 lb off the least assistance', () => {
    setWeightUnit('lb');
    const s = suggestProgression(exercise({ loadMode: 'assisted' }), last([40, 30]));
    expect(shownWeight(s!.weight!)).toBe(25);
  });

  it('lists watch targets in pounds', () => {
    expect(exerciseDetail(exercise({ targetWeight: fromUnit(135, 'lb') }), 'lb')).toBe('3 × 5 · 135 lb');
  });
});
