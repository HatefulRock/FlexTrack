import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { WidgetSnapshot } from '../utils/widgetData';
import { NextWorkoutWidget, StreakWidget, WIDGET_SNAPSHOT_KEY } from './AndroidWidgets';

const readSnapshot = async (): Promise<WidgetSnapshot | null> => {
  try {
    const parsed: unknown = JSON.parse((await AsyncStorage.getItem(WIDGET_SNAPSHOT_KEY)) ?? 'null');
    return parsed && typeof parsed === 'object' && Array.isArray((parsed as WidgetSnapshot).schedule) ? parsed as WidgetSnapshot : null;
  } catch { return null; }
};

// Runs headless when a widget is added, resized or due for its periodic refresh (which rolls the day over).
export const registerWidgets = () => registerWidgetTaskHandler(async ({ widgetInfo, widgetAction, renderWidget }) => {
  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
  const snapshot = await readSnapshot();
  renderWidget(widgetInfo.widgetName === 'NextWorkout' ? <NextWorkoutWidget snapshot={snapshot} /> : <StreakWidget snapshot={snapshot} />);
});
