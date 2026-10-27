import { Easing, Platform } from 'react-native';

// Calibrated: colour is a measurement. Hues come from IWF calibrated plates; everything else is rubber floor and chalk.
export const plates = {
  25: '#D2232A', 20: '#1E5BC6', 15: '#F3C316', 10: '#1E9B4B', 5: '#F2F1EC', 2.5: '#3A3D40', 1.25: '#B9BDC1', 0.5: '#B9BDC1',
} as const;

export const fonts = {
  display: 'BigShouldersDisplay_800ExtraBold',
  displayBold: 'BigShouldersDisplay_700Bold',
  displayBlack: 'BigShouldersDisplay_900Black',
  text: 'Archivo_400Regular',
  textMedium: 'Archivo_500Medium',
  textSemiBold: 'Archivo_600SemiBold',
  textBold: 'Archivo_700Bold',
} as const;

export const theme = {
  colors: {
    // Ground and surfaces: rubber flooring, filled, no borders.
    canvas: '#141516', surface: '#1D1F21', surfaceElevated: '#26292C', surfacePressed: '#303438',
    // Hairlines inside lists only; borderStrong is the 3:1 boundary for inputs.
    border: '#2E3236', borderStrong: '#6B706C',
    // Chalk is the primary action colour; rubber text sits on it.
    primary: '#F2F1EC', primaryStrong: '#FFFFFF', onPrimary: '#141516', primarySoft: 'rgba(242, 241, 236, 0.08)',
    // Yellow 15 kg plate: personal records and nothing else.
    record: '#F3C316', onRecord: '#141516', recordSoft: 'rgba(243, 195, 22, 0.12)',
    // Kept as an alias of record so old call sites cannot introduce a second accent.
    energy: '#F3C316', energySoft: 'rgba(243, 195, 22, 0.12)',
    // A good lift is a white light. Improvement is printed in chalk with a sign: green belongs to the legs category only.
    done: '#F2F1EC', success: '#F2F1EC', successFill: '#F2F1EC', successSoft: 'rgba(242, 241, 236, 0.08)',
    warning: '#F3C316',
    // Red 25 kg plate is the judges' no-lift light: missed sets and destructive actions.
    danger: '#F0676B', dangerFill: '#D2232A', dangerSoft: 'rgba(210, 35, 42, 0.14)',
    blue: '#1E5BC6', blueText: '#7FA6EE',
    text: '#F2F1EC', textSecondary: '#C9C9C3', textMuted: '#A3A59F', textSubtle: '#8E908B',
    white: '#FFFFFF', black: '#000000', overlay: 'rgba(8, 9, 10, 0.82)',
  },
  category: { push: plates[25], pull: plates[20], legs: plates[10], cardio: plates[1.25], other: '#5A5E62' },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
  radius: { sm: 4, md: 6, lg: 10, xl: 14, pill: 999 },
  type: {
    timer: { fontFamily: fonts.display, fontSize: 64, lineHeight: 66, letterSpacing: -0.5, fontVariant: ['tabular-nums'] as const },
    display: { fontFamily: fonts.display, fontSize: 40, lineHeight: 42, letterSpacing: -0.4 },
    title: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 34, letterSpacing: -0.2 },
    metric: { fontFamily: fonts.display, fontSize: 34, lineHeight: 36, fontVariant: ['tabular-nums'] as const },
    heading: { fontFamily: fonts.textSemiBold, fontSize: 17, lineHeight: 22 },
    body: { fontFamily: fonts.text, fontSize: 15, lineHeight: 22 },
    label: { fontFamily: fonts.textSemiBold, fontSize: 14, lineHeight: 18 },
    button: { fontFamily: fonts.textBold, fontSize: 16, lineHeight: 20 },
    caption: { fontFamily: fonts.textMedium, fontSize: 12, lineHeight: 16 },
    numeric: { fontFamily: fonts.textSemiBold, fontVariant: ['tabular-nums'] as const },
  },
  shadow: {
    card: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.28, shadowRadius: 6, elevation: 2 },
    sheet: { shadowColor: '#000000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 12 },
    // No glow in this world; kept so legacy spreads resolve to nothing.
    glow: {},
  },
  motion: {
    easeOut: Easing.bezier(0.23, 1, 0.32, 1),
    easeInOut: Easing.bezier(0.77, 0, 0.175, 1),
    drawer: Easing.bezier(0.32, 0.72, 0, 1),
    fast: 120, base: 200, slow: 280,
    nativeDriver: Platform.OS !== 'web',
  },
} as const;

export const Colors = {
  light: { text: '#11181C', background: '#FFFFFF', tint: '#141516', icon: '#687076', tabIconDefault: '#687076', tabIconSelected: '#141516' },
  dark: { text: theme.colors.text, background: theme.colors.canvas, tint: theme.colors.primary, icon: theme.colors.textMuted, tabIconDefault: theme.colors.textMuted, tabIconSelected: theme.colors.primary },
};

export const Fonts = Platform.select({
  ios: { sans: fonts.text, serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: fonts.text, serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: fonts.text, serif: 'Georgia, serif', rounded: 'system-ui', mono: 'ui-monospace, monospace' },
});
