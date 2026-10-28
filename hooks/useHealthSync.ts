import { useCallback, useEffect, useRef, useState } from 'react';
import { showAlert } from '../components/ui/Dialog';
import { WorkoutLog } from '../types';
import { healthPlatform } from '../utils/healthPlatform';
import { loadHealthSyncEnabled, saveHealthSyncEnabled, sendToHealth } from '../utils/healthSync';

const plural = (n: number) => `${n} workout${n === 1 ? '' : 's'}`;

// Opt-in export of finished workouts to Apple Health or Health Connect. Off until the user turns it on.
export const useHealthSync = () => {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    if (!healthPlatform) return;
    void Promise.all([healthPlatform.isAvailable().catch(() => false), loadHealthSyncEnabled()]).then(([isAvailable, isEnabled]) => {
      if (!mounted) return;
      setAvailable(isAvailable);
      enabledRef.current = isAvailable && isEnabled; setEnabled(enabledRef.current);
    });
    return () => { mounted = false; };
  }, []);

  const setSync = useCallback((next: boolean) => {
    enabledRef.current = next; setEnabled(next);
    void saveHealthSyncEnabled(next).catch(() => undefined);
  }, []);

  const sendAll = useCallback((logs: WorkoutLog[]) => {
    if (!healthPlatform) return;
    const name = healthPlatform.name;
    void sendToHealth(logs)
      .then(({ sent, skipped }) => showAlert(`Sent to ${name}`, `${plural(sent)} sent.${skipped ? ` ${plural(skipped)} without a duration stayed in FlexTrack only.` : ''}`))
      .catch(() => showAlert('Sync failed', `${name} did not accept the workouts. Check that FlexTrack may write workouts in ${name}'s settings.`));
  }, []);

  // Called once a session is saved locally. A failure never touches the local copy.
  const onLogSaved = useCallback((log: WorkoutLog) => {
    if (!enabledRef.current || !healthPlatform) return;
    const name = healthPlatform.name;
    void sendToHealth([log]).catch(() => showAlert('Not sent to ' + name, `The workout is saved in FlexTrack, but ${name} did not accept it. You can resend everything from History.`));
  }, []);

  const openSettings = useCallback((logs: WorkoutLog[]) => {
    if (!healthPlatform) return;
    const platform = healthPlatform;
    if (enabledRef.current) {
      showAlert(`${platform.name} sync is on`, `Each finished workout is written to ${platform.name}. Workouts already sent are never duplicated.`, [
        { text: 'Turn off', style: 'destructive', onPress: () => setSync(false) },
        { text: 'Resend all', onPress: () => sendAll(logs) },
        { text: 'Done', style: 'cancel' },
      ]);
      return;
    }
    const turnOn = () => {
      void platform.requestAccess().then(granted => {
        if (!granted) { showAlert('No access', `FlexTrack needs permission to write workouts. You can allow it in ${platform.name}'s settings.`); return; }
        setSync(true);
        if (logs.length) showAlert(`Send past workouts?`, `You have ${plural(logs.length)} in FlexTrack. Send them to ${platform.name} too?`, [
          { text: 'Only new ones', style: 'cancel' },
          { text: 'Send all', onPress: () => sendAll(logs) },
        ]);
      }).catch(() => showAlert('No access', `${platform.name} could not be opened. Try again.`));
    };
    showAlert(`Sync with ${platform.name}?`, `FlexTrack will write each finished workout to ${platform.name}: type, start and end time, and distance for runs, walks and rides. Watches and apps that read ${platform.name}, like Garmin Connect, Fitbit or Strava, can see them there. Nothing is read back, and nothing goes anywhere else.`, [
      { text: 'Not now', style: 'cancel' },
      { text: 'Turn on', onPress: turnOn },
    ]);
  }, [sendAll, setSync]);

  return { available, enabled, platformName: healthPlatform?.name ?? null, onLogSaved, openSettings };
};
