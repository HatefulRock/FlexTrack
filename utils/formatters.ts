export const getShortDayName = (dayIndex: number) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex];
};

export const formatSchedule = (days: number[] | undefined) => {
    if (!days || days.length === 0) return 'Unscheduled';
    if (days.length === 7) return 'Every Day';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Weekdays';
    return days.sort().map(d => getShortDayName(d)).join(', ');
};