import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { UserProfile, WorkoutLog, WorkoutTemplate } from '../types';

export interface ExportPayload { app: 'FlexTrack'; format: 1; exportedAt: string; templates: WorkoutTemplate[]; logs: WorkoutLog[]; profile: UserProfile; }

export const buildExport = (templates: WorkoutTemplate[], logs: WorkoutLog[], profile: UserProfile, now = new Date()): ExportPayload =>
  ({ app: 'FlexTrack', format: 1, exportedAt: now.toISOString(), templates, logs, profile });

export const exportFileName = (now = new Date()) => `flextrack-${format(now, 'yyyy-MM-dd')}.json`;

// Everything lives on the device, so this is the user's only copy outside the app.
// Native writes a JSON file to the cache and opens the share sheet; web downloads it.
export const shareExport = async (payload: ExportPayload): Promise<void> => {
  const json = JSON.stringify(payload, null, 2);
  const name = exportFileName(new Date(payload.exportedAt));
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available');
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export FlexTrack data', UTI: 'public.json' });
};
