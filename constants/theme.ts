import { Platform } from 'react-native';

export const theme = {
  colors: {
    canvas: '#080B10', surface: '#111722', surfaceElevated: '#182130', surfacePressed: '#202C3D',
    border: '#263245', borderStrong: '#34435A', primary: '#38BDF8', primaryStrong: '#0EA5E9',
    primarySoft: 'rgba(56, 189, 248, 0.12)', energy: '#A3E635', energySoft: 'rgba(163, 230, 53, 0.12)',
    success: '#34D399', warning: '#FBBF24', danger: '#FB7185', dangerSoft: 'rgba(251, 113, 133, 0.12)',
    text: '#F7F9FC', textSecondary: '#CBD5E1', textMuted: '#94A3B8', textSubtle: '#64748B',
    white: '#FFFFFF', black: '#000000', overlay: 'rgba(3, 6, 12, 0.78)',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 },
  type: {
    display: { fontSize: 30, lineHeight: 36, fontWeight: '800' as const, letterSpacing: -0.8 },
    title: { fontSize: 22, lineHeight: 28, fontWeight: '800' as const, letterSpacing: -0.4 },
    heading: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
    body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
    label: { fontSize: 13, lineHeight: 18, fontWeight: '700' as const },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
    metric: { fontSize: 26, lineHeight: 30, fontWeight: '800' as const },
  },
  shadow: {
    card: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 5 },
    glow: { shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 14, elevation: 6 },
  },
} as const;

export const Colors = {
  light: { text: '#11181C', background: '#FFFFFF', tint: '#0A7EA4', icon: '#687076', tabIconDefault: '#687076', tabIconSelected: '#0A7EA4' },
  dark: { text: theme.colors.text, background: theme.colors.canvas, tint: theme.colors.primary, icon: theme.colors.textMuted, tabIconDefault: theme.colors.textMuted, tabIconSelected: theme.colors.primary },
};

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", serif: 'Georgia, serif', rounded: 'system-ui', mono: 'ui-monospace, monospace' },
});


