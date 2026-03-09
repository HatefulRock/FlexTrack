import { useState, useEffect } from 'react';

export const useWorkoutTimer = () => {
  const [timers, setTimers] = useState<{[key: string]: number}>({}); // Per set timers
  const [timerRunning, setTimerRunning] = useState<{[key: string]: boolean}>({});
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
        // Update active set timers
        setTimers(prev => {
            const next = { ...prev };
            Object.keys(timerRunning).forEach(key => {
                if (timerRunning[key]) next[key] = (next[key] || 0) + 1;
            });
            return next;
        });
        
        // Update rest timer
        if (isResting && restTimer > 0) {
            setRestTimer(prev => prev - 1);
        } else if (isResting && restTimer <= 0) {
            setIsResting(false);
        }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, isResting, restTimer]);

  const toggleTimer = (id: string) => {
    setTimerRunning(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startRest = (seconds: number) => {
    setRestTimer(seconds);
    setIsResting(true);
  };

  const cancelRest = () => setIsResting(false);

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