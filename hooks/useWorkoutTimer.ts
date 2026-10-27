import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';

// Set timers count up; the rest timer counts down from a fixed end timestamp so ±15 s and backgrounding stay exact.
export const useWorkoutTimer = () => {
  const [timers, setTimers] = useState<{ [key: string]: number }>({}); // Per set timers
  const [timerRunning, setTimerRunning] = useState<{ [key: string]: boolean }>({});
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const lastCue = useRef<number | null>(null);
  const endsAtRef = useRef<number | null>(null);
  endsAtRef.current = restEndsAt;

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
        setRestTimer(0);
        setRestEndsAt(null);
        if (lastCue.current !== 0) { lastCue.current = 0; void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
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

  const startRest = (seconds: number) => {
    const duration = Math.max(0, Math.floor(seconds));
    lastCue.current = null;
    setRestTotal(duration);
    setRestTimer(duration);
    endsAtRef.current = duration > 0 ? Date.now() + duration * 1000 : null;
    setRestEndsAt(endsAtRef.current);
  };

  const cancelRest = () => {
    lastCue.current = null;
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
