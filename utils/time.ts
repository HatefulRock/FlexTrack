export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Accepts SS, MM:SS or HH:MM:SS and returns seconds.
export const parseTimeString = (str: string): number => {
    const parts = str.trim().split(':').map(Number);
    if (!parts.length || parts.some(n => !Number.isFinite(n) || n < 0)) return 0;
    return parts.reduce((total, part) => total * 60 + part, 0);
};
