import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { WidgetSnapshot } from './widgetData';
import { NextWorkoutWidget, StreakWidget, WIDGET_SNAPSHOT_KEY } from '../widgets/AndroidWidgets';

export const publishWidgetSnapshot = async (snapshot: WidgetSnapshot) => {
  await AsyncStorage.setItem(WIDGET_SNAPSHOT_KEY, JSON.stringify(snapshot));
  await requestWidgetUpdate({ widgetName: 'Streak', renderWidget: () => <StreakWidget snapshot={snapshot} /> });
  await requestWidgetUpdate({ widgetName: 'NextWorkout', renderWidget: () => <NextWorkoutWidget snapshot={snapshot} /> });
};
