// Web build: the native share sheet is unavailable; callers fall back to a download.
export const isAvailableAsync = async () => false;
export const shareAsync = async (_url: string, _options?: unknown) => {};
