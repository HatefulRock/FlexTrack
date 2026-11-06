import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { ImportError, MAX_IMPORT_CHARACTERS } from './importData';

// Opens the system file picker and returns the chosen file's text, or null if the user cancelled.
// Files saved from the export share sheet to Drive, iCloud or Downloads come back here.
export const pickBackupText = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return pickOnWeb();
  // Android file managers often label a .json file as plain text or untyped data, so those stay pickable;
  // the contents are checked either way.
  const picked = await File.pickFileAsync({ mimeTypes: Platform.OS === 'android' ? ['application/json', 'text/plain', 'application/octet-stream'] : ['application/json'] });
  if (picked.canceled) return null;
  // Checked before reading it into memory. UTF-8 takes at most four bytes a character, so a file over this is
  // certainly over the character limit that parseImport applies.
  if (picked.result.size > MAX_IMPORT_CHARACTERS * 4) throw new ImportError('too-large');
  return picked.result.text();
};

const pickOnWeb = () => new Promise<string | null>((resolve, reject) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.style.display = 'none';
  const done = () => input.remove();
  input.addEventListener('cancel', () => { done(); resolve(null); });
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    done();
    if (!file) return resolve(null);
    if (file.size > MAX_IMPORT_CHARACTERS * 4) return reject(new ImportError('too-large'));
    file.text().then(resolve, reject);
  });
  document.body.appendChild(input);
  input.click();
});
