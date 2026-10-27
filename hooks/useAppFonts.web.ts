import { useEffect, useState } from 'react';
import bsd700 from '@expo-google-fonts/big-shoulders-display/BigShouldersDisplay_700Bold.ttf?url';
import bsd800 from '@expo-google-fonts/big-shoulders-display/BigShouldersDisplay_800ExtraBold.ttf?url';
import bsd900 from '@expo-google-fonts/big-shoulders-display/BigShouldersDisplay_900Black.ttf?url';
import arc400 from '@expo-google-fonts/archivo/400Regular/Archivo_400Regular.ttf?url';
import arc500 from '@expo-google-fonts/archivo/500Medium/Archivo_500Medium.ttf?url';
import arc600 from '@expo-google-fonts/archivo/600SemiBold/Archivo_600SemiBold.ttf?url';
import arc700 from '@expo-google-fonts/archivo/700Bold/Archivo_700Bold.ttf?url';

// Web (Vite): the same family names as native, registered through the FontFace API.
const faces: Record<string, string> = {
  BigShouldersDisplay_700Bold: bsd700, BigShouldersDisplay_800ExtraBold: bsd800, BigShouldersDisplay_900Black: bsd900,
  Archivo_400Regular: arc400, Archivo_500Medium: arc500, Archivo_600SemiBold: arc600, Archivo_700Bold: arc700,
};

let loading: Promise<unknown> | null = null;
const loadAll = () => loading ??= Promise.all(Object.entries(faces).map(([family, url]) =>
  new FontFace(family, `url(${url})`).load().then(face => { document.fonts.add(face); })));

export const useAppFonts = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    // A font that fails to load falls back to the CSS stack; never block the app on it.
    loadAll().catch(() => undefined).finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);
  return ready;
};
