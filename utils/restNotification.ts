import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Lock-screen "rest is over" alert. Native only: on web every export is an instant no-op.
// Nothing here may throw: a failed notification must never interrupt a session.

const IS_WEB = Platform.OS === 'web';
const ASKED_KEY = 'rest-notification-permission-asked';
const CHANNEL_ID = 'rest';

// In the foreground the in-app countdown and haptics already announce the end of rest, so stay silent there.
// Background and lock-screen delivery bypass this handler and use the system presentation.
if (!IS_WEB) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false }),
    });
  } catch {}
}

let channelReady: Promise<void> | null = null;
const ensureChannel = () => {
  if (Platform.OS !== 'android') return Promise.resolve();
  channelReady ??= Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Rest timer',
    importance: Notifications.AndroidImportance.HIGH,
    enableVibrate: true,
    vibrationPattern: [0, 250, 150, 250],
    sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  }).then(() => undefined, () => { channelReady = null; });
  return channelReady;
};

const resolvePermission = async (): Promise<boolean> => {
  try {
    await ensureChannel(); // Android 13+ only shows the prompt once a channel exists.
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (await AsyncStorage.getItem(ASKED_KEY)) return false;
    if (!current.canAskAgain) { await AsyncStorage.setItem(ASKED_KEY, '1'); return false; }
    const answer = await Notifications.requestPermissionsAsync();
    if (!answer.granted) await AsyncStorage.setItem(ASKED_KEY, '1');
    return answer.granted;
  } catch {
    return false;
  }
};

let permission: Promise<boolean> | null = null;
// Asks at most once, lazily, the first time a rest starts. A denial is remembered and never re-asked.
export const ensureRestNotificationPermission = (): Promise<boolean> => {
  if (IS_WEB) return Promise.resolve(false);
  permission ??= resolvePermission().then(granted => { if (!granted) permission = null; return granted; });
  return permission;
};

// Schedules "Rest is over" at `endsAt` (epoch ms). Resolves to the notification id, or null if nothing was scheduled.
export const scheduleRestEnd = async (endsAt: number, nextLabel?: string): Promise<string | null> => {
  if (IS_WEB) return null;
  try {
    await ensureChannel();
    const seconds = Math.max(1, Math.round((endsAt - Date.now()) / 1000));
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: 'Rest is over', body: nextLabel ? `Next: ${nextLabel}` : 'Time for your next set', sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, channelId: CHANNEL_ID },
    });
    return id || null;
  } catch {
    return null;
  }
};

export const cancelRestEnd = async (id: string | null | undefined): Promise<void> => {
  if (IS_WEB || !id) return;
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
};
