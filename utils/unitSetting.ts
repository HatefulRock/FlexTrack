import AsyncStorage from '@react-native-async-storage/async-storage';
import { isWeightUnit, WeightUnit } from './units';

const KEY = 'weight-unit';

// null when never chosen: App then picks a default once it knows whether this install already has data.
export const loadWeightUnit = (): Promise<WeightUnit | null> => AsyncStorage.getItem(KEY).then(v => (isWeightUnit(v) ? v : null), () => null);
export const saveWeightUnit = (unit: WeightUnit) => AsyncStorage.setItem(KEY, unit).catch(() => undefined);

export const deviceLocale = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().locale; } catch { return undefined; }
};
