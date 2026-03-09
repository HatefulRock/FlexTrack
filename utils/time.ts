export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const parseTimeString = (str: string): number => {
    if (str.includes(':')) {
        const [mins, secs] = str.split(':').map(Number);
        return (mins * 60) + (secs || 0);
    }
    return parseInt(str) || 0;
};