import { useEffect, useMemo } from 'react';
import { WorkoutLog, WorkoutTemplate } from '../types';
import { publishWatchSnapshot } from '../utils/watchBridge';
import { buildWatchSnapshot } from '../utils/watchData';
import { publishWidgetSnapshot } from '../utils/widgetBridge';

// Keeps the home-screen widgets and the watch apps in step with routines and history. The snapshot
// only ever goes to this phone's widgets and the user's own paired watch.
export const useWidgetSync = (templates: WorkoutTemplate[], logs: WorkoutLog[], ready: boolean) => {
  const snapshot = useMemo(() => JSON.stringify(buildWatchSnapshot(templates, logs)), [templates, logs]);
  useEffect(() => {
    if (!ready) return;
    const parsed = JSON.parse(snapshot);
    void publishWidgetSnapshot(parsed).catch(() => undefined);
    void publishWatchSnapshot(parsed).catch(() => undefined);
  }, [snapshot, ready]);
};
