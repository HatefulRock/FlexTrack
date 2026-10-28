import { describe, expect, it } from 'vitest';
import { buildExport, exportFileName } from '../utils/exportData';

describe('buildExport', () => {
  it('wraps all user data with a format version', () => {
    const now = new Date(Date.UTC(2026, 9, 28, 9));
    const payload = buildExport([], [], { weightLogs: [{ date: 1, weight: 80 }], height: 180 }, now);
    expect(payload).toEqual({ app: 'FlexTrack', format: 1, exportedAt: '2026-10-28T09:00:00.000Z', templates: [], logs: [], profile: { weightLogs: [{ date: 1, weight: 80 }], height: 180 } });
    expect(exportFileName(now)).toBe('flextrack-2026-10-28.json');
  });
});
