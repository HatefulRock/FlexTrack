import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { cancelRestEnd, ensureRestNotificationPermission, scheduleRestEnd } from '../utils/restNotification';

// Beyond this the end-of-rest tick ran late because the app was suspended, not because of interval jitter.
const LATE_CUE_MS = 2000;

// Set timers count up; the rest timer counts down from a fixed end timestamp so ±15 s and backgrounding stay exact.
export const useWorkoutTimer = () => {
  const [timers, setTimers] = useState<{ [key: string]: number }>({}); // Per set timers
  const [timerRunning, setTimerRunning] = useState<{ [key: string]: boolean }>({});
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const lastCue = useRef<number | null>(null);
  // Mirrors restEndsAt for synchronous reads: two ±15 s taps can land before a re-render.
  const endsAtRef = useRef<number | null>(null);

  // Lock-screen alert for the end of rest. `notifyGen` invalidates async schedules overtaken by a skip, ±15 s or a new rest.
  const notifyId = useRef<string | null>(null);
  const notifyGen = useRef(0);
  const nextLabelRef = useRef<string | undefined>(undefined);
  const clearRestNotification = () => {
    notifyGen.current += 1;
    const id = notifyId.current;
    notifyId.current = null;
    if (id) void cancelRestEnd(id);
  };
  const scheduleRestNotification = (endsAt: number) => {
    clearRestNotification();
    const gen = notifyGen.current;
    void (async () => {
      if (!(await ensureRestNotificationPermission()) || gen !== notifyGen.current) return;
      const id = await scheduleRestEnd(endsAt, nextLabelRef.current);
      if (gen === notifyGen.current) notifyId.current = id;
      else void cancelRestEnd(id);
    })();
  };
  useEffect(() => () => clearRestNotification(), []);

  const hasRunningTimer = useMemo(() => Object.values(timerRunning).some(Boolean), [timerRunning]);
  const lastTick = useRef(0);

  useEffect(() => {
    if (!hasRunningTimer) return;
    lastTick.current = Date.now();
    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastTick.current) / 1000);
      if (elapsedSeconds < 1) return;
      lastTick.current += elapsedSeconds * 1000;
      setTimers(previous => {
        const next = { ...previous };
        for (const key of Object.keys(timerRunning)) if (timerRunning[key]) next[key] = (next[key] || 0) + elapsedSeconds;
        return next;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [hasRunningTimer, timerRunning]);

  useEffect(() => {
    if (restEndsAt === null) return;
    const tick = () => {
      const left = Math.ceil((restEndsAt - Date.now()) / 1000);
      if (left <= 0) {
        endsAtRef.current = null;
        setRestTimer(0);
        setRestEndsAt(null);
        clearRestNotification();
        // Coming back from the background long after rest ended: the notification already said so, don't buzz now.
        const onTime = Date.now() - restEndsAt < LATE_CUE_MS;
        if (lastCue.current !== 0 && onTime) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        lastCue.current = 0;
        return;
      }
      setRestTimer(left);
      if (left <= 3 && lastCue.current !== left) { lastCue.current = left; void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    };
    tick();
    const interval = setInterval(tick, 200);
    const sub = AppState.addEventListener('change', state => { if (state === 'active') tick(); });
    return () => { clearInterval(interval); sub.remove(); };
  }, [restEndsAt]);

  const toggleTimer = (id: string) => {
    setTimerRunning(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // nextLabel (optional) fills the notification body, e.g. "Bench Press · 85 kg × 6" → "Next: Bench Press · 85 kg × 6".
  const startRest = (seconds: number, nextLabel?: string) => {
    const duration = Math.max(0, Math.floor(seconds));
    lastCue.current = null;
    nextLabelRef.current = nextLabel;
    setRestTotal(duration);
    setRestTimer(duration);
    endsAtRef.current = duration > 0 ? Date.now() + duration * 1000 : null;
    setRestEndsAt(endsAtRef.current);
    if (endsAtRef.current !== null) scheduleRestNotification(endsAtRef.current);
    else clearRestNotification();
  };

  const cancelRest = () => {
    lastCue.current = null;
    clearRestNotification();
    endsAtRef.current = null;
    setRestEndsAt(null);
    setRestTimer(0);
  };

  const adjustRest = (seconds: number) => {
    const prev = endsAtRef.current;
    if (prev === null) return;
    const next = prev + seconds * 1000;
    const remaining = Math.ceil((next - Date.now()) / 1000);
    if (remaining <= 0) { cancelRest(); return; }
    if (remaining > 3) lastCue.current = null;
    endsAtRef.current = next;
    setRestTimer(remaining);
    setRestTotal(total => Math.max(total, remaining));
    setRestEndsAt(next);
    scheduleRestNotification(next);
  };

  return {
    timers,
    timerRunning,
    restTimer,
    restEndsAt,
    restTotal,
    isResting: restEndsAt !== null,
    toggleTimer,
    startRest,
    cancelRest,
    adjustRest
  };
};
