import { useEffect, useMemo, useRef, useState } from 'react';

export const useWorkoutTimer = () => {
  const [timers, setTimers] = useState<{[key: string]: number}>({}); // Per set timers
  const [timerRunning, setTimerRunning] = useState<{[key: string]: boolean}>({});
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);

  const hasRunningTimer = useMemo(() => Object.values(timerRunning).some(Boolean), [timerRunning]);
  const lastTick = useRef(0);

  useEffect(() => {
    if (!hasRunningTimer && !isResting) return;

    lastTick.current = Date.now();
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - lastTick.current) / 1000);
      if (elapsedSeconds < 1) return;
      lastTick.current += elapsedSeconds * 1000;

      if (hasRunningTimer) {
        setTimers(previous => {
          const next = { ...previous };
          for (const key of Object.keys(timerRunning)) {
            if (timerRunning[key]) next[key] = (next[key] || 0) + elapsedSeconds;
          }
          return next;
        });
      }

      if (isResting) {
        setRestTimer(previous => Math.max(0, previous - elapsedSeconds));
      }
    }, 250);
    return () => clearInterval(interval);
  }, [hasRunningTimer, isResting, timerRunning]);

  useEffect(() => {
    if (isResting && restTimer === 0) setIsResting(false);
  }, [isResting, restTimer]);

  const toggleTimer = (id: string) => {
    setTimerRunning(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startRest = (seconds: number) => {
    const duration = Math.max(0, Math.floor(seconds));
    setRestTimer(duration);
    setIsResting(duration > 0);
  };

  const cancelRest = () => {
    setIsResting(false);
    setRestTimer(0);
  };

  const adjustRest = (seconds: number) => {
    setRestTimer(prev => Math.max(0, prev + seconds));
  };

  return {
    timers,
    timerRunning,
    restTimer,
    isResting,
    toggleTimer,
    startRest,
    cancelRest,
    adjustRest
  };
};
