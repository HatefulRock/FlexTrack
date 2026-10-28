import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';

// Files handed to the share sheet (data exports, session images) hold personal training data. They live in one
// cache folder that is emptied on the next launch and before each new share. Not straight after sharing: on Android
// the receiving app may still be reading the file when the share call returns.
const sharedDir = () => new Directory(Paths.cache, 'shared');

export const clearSharedFiles = () => {
  if (Platform.OS === 'web') return;
  try { const dir = sharedDir(); if (dir.exists) dir.delete(); } catch {}
};

// A fresh, empty folder for the next shared file.
const freshSharedDir = () => {
  clearSharedFiles();
  const dir = sharedDir();
  dir.create({ intermediates: true, idempotent: true });
  return dir;
};

export const writeSharedFile = (name: string, content: string): string => {
  const file = new File(freshSharedDir(), name);
  file.create({ overwrite: true });
  file.write(content);
  return file.uri;
};

// Moves a file another library wrote (e.g. a view-shot capture) into the shared folder, so it is cleaned up too.
export const adoptSharedFile = (uri: string): string => {
  const file = new File(uri);
  file.move(freshSharedDir());
  return file.uri;
};
