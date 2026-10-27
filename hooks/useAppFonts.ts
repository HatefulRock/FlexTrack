import { useFonts } from 'expo-font';
import {
  BigShouldersDisplay_700Bold, BigShouldersDisplay_800ExtraBold, BigShouldersDisplay_900Black,
} from '@expo-google-fonts/big-shoulders-display';
import { Archivo_400Regular, Archivo_500Medium, Archivo_600SemiBold, Archivo_700Bold } from '@expo-google-fonts/archivo';

// Native: register each weight as its own family; theme.fonts names them.
export const useAppFonts = () => {
  const [loaded, error] = useFonts({
    BigShouldersDisplay_700Bold, BigShouldersDisplay_800ExtraBold, BigShouldersDisplay_900Black,
    Archivo_400Regular, Archivo_500Medium, Archivo_600SemiBold, Archivo_700Bold,
  });
  return loaded || !!error;
};
