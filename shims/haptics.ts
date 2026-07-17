export const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy', Rigid: 'rigid', Soft: 'soft' } as const;
export const NotificationFeedbackType = { Success: 'success', Warning: 'warning', Error: 'error' } as const;
export const selectionAsync = async () => {};
export const impactAsync = async (_style?: string) => {};
export const notificationAsync = async (_type?: string) => {};

