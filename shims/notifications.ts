// Web build: local notifications are a native feature; every call resolves to a harmless default.
export const setNotificationHandler = (_handler: unknown) => {};
export const getPermissionsAsync = async () => ({ granted: false, canAskAgain: false, status: 'denied' as const });
export const requestPermissionsAsync = async () => ({ granted: false, canAskAgain: false, status: 'denied' as const });
export const scheduleNotificationAsync = async (_request: unknown) => '';
export const cancelScheduledNotificationAsync = async (_id: string) => {};
export const setNotificationChannelAsync = async (_id: string, _channel: unknown) => null;
export const AndroidImportance = { DEFAULT: 3, HIGH: 4, MAX: 5 } as const;
export const AndroidNotificationVisibility = { UNKNOWN: 0, PUBLIC: 1, PRIVATE: 2, SECRET: 3 } as const;
export const SchedulableTriggerInputTypes = { TIME_INTERVAL: 'timeInterval', DATE: 'date' } as const;
