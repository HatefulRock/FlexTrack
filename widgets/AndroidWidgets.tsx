import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WidgetSnapshot, widgetView } from '../utils/widgetData';

export const WIDGET_SNAPSHOT_KEY = 'widget-snapshot';

// Widgets are drawn as native views, so they take hex values rather than the theme tokens they mirror.
const C = { canvas: '#141516', text: '#F2F1EC', muted: '#A3A59F' } as const;
const DISPLAY = 'BigShouldersDisplay_800ExtraBold', TEXT = 'Archivo_400Regular', LABEL = 'Archivo_600SemiBold';

const Frame = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <FlexWidget clickAction="OPEN_APP" accessibilityLabel={label}
    style={{ height: 'match_parent', width: 'match_parent', backgroundColor: C.canvas, borderRadius: 16, padding: 16, flexDirection: 'column', justifyContent: 'space-between' }}>
    {children}
  </FlexWidget>
);
const Eyebrow = ({ text }: { text: string }) =>
  <TextWidget text={text.toUpperCase()} style={{ fontFamily: LABEL, fontSize: 12, letterSpacing: 1, color: C.muted }} />;

export const StreakWidget = ({ snapshot, now = new Date() }: { snapshot: WidgetSnapshot | null; now?: Date }) => {
  const view = snapshot ? widgetView(snapshot, now) : null, streak = view?.streak ?? 0;
  const status = view?.trainedToday ? 'Trained today' : streak > 0 ? 'Train today to keep it' : 'Start one today';
  return <Frame label={`${streak} day streak. ${status}`}>
    <Eyebrow text="Streak" />
    <FlexWidget style={{ flexDirection: 'column' }}>
      <TextWidget text={String(streak)} style={{ fontFamily: DISPLAY, fontSize: 52, color: C.text }} />
      <TextWidget text={streak === 1 ? 'day' : 'days'} style={{ fontFamily: LABEL, fontSize: 14, color: C.text }} />
    </FlexWidget>
    <TextWidget text={status} truncate="END" maxLines={1} style={{ fontFamily: TEXT, fontSize: 13, color: C.muted }} />
  </Frame>;
};

export const NextWorkoutWidget = ({ snapshot, now = new Date() }: { snapshot: WidgetSnapshot | null; now?: Date }) => {
  const next = snapshot ? widgetView(snapshot, now).next : null;
  if (!next) return <Frame label="No routine scheduled">
    <Eyebrow text="Next workout" />
    <TextWidget text="Nothing scheduled" style={{ fontFamily: DISPLAY, fontSize: 28, color: C.text }} />
    <TextWidget text="Pick days on a routine to see it here" truncate="END" maxLines={2} style={{ fontFamily: TEXT, fontSize: 13, color: C.muted }} />
  </Frame>;
  const detail = `${next.exercises} exercise${next.exercises === 1 ? '' : 's'}`;
  return <Frame label={`Next workout ${next.when}: ${next.name}, ${detail}`}>
    <Eyebrow text={next.when} />
    <TextWidget text={next.name} truncate="END" maxLines={2} style={{ fontFamily: DISPLAY, fontSize: 32, color: C.text }} />
    <TextWidget text={detail} style={{ fontFamily: TEXT, fontSize: 13, color: C.muted }} />
  </Frame>;
};
