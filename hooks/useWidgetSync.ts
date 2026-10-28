import { useEffect, useMemo } from 'react';
import { WorkoutLog, WorkoutTemplate } from '../types';
import { publishWidgetSnapshot } from '../utils/widgetBridge';
import { buildWidgetSnapshot } from '../utils/widgetData';

// Keeps the home-screen widgets in step with routines and history. The snapshot stays on the device.
export const useWidgetSync = (templates: WorkoutTemplate[], logs: WorkoutLog[], ready: boolean) => {
  const snapshot = useMemo(() => JSON.stringify(buildWidgetSnapshot(templates, logs)), [templates, logs]);
  useEffect(() => {
    if (ready) void publishWidgetSnapshot(JSON.parse(snapshot)).catch(() => undefined);
  }, [snapshot, ready]);
};
