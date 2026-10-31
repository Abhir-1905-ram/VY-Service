import { Platform } from 'react-native';

/**
 * VY Service design tokens.
 * Single source of truth for colors, spacing, radii, typography and shadows.
 * Brand: deep navy surfaces, electric blue accent (the "V"), silver highlight (the "Y").
 */

export const colors = {
  // Brand
  primary: '#1F6BFF',
  primaryDark: '#0B3D91',
  primaryDeep: '#081C45',
  primarySoft: '#E8F0FF',
  primaryBorder: '#C7D9FF',
  silver: '#CBD5E1',
  silverSoft: '#F1F5F9',

  // Neutral surfaces
  bg: '#F3F5F9',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F9FC',
  border: '#E3E8F0',
  borderStrong: '#CBD3DF',
  overlay: 'rgba(8, 28, 69, 0.55)',

  // Text
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#8A94A6',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: 'rgba(255,255,255,0.72)',

  // Semantic
  success: '#16A34A',
  successSoft: '#E6F6EC',
  warning: '#F59E0B',
  warningSoft: '#FFF4DF',
  danger: '#DC2626',
  dangerSoft: '#FDECEC',
  info: '#0EA5E9',
  infoSoft: '#E6F6FD',
  neutral: '#64748B',
  neutralSoft: '#EEF2F7',

  // Legacy aliases (kept so older imports keep working)
  secondary: '#1F6BFF',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',
  accentOrange: '#F59E0B',
  borderPrimarySoft: '#C7D9FF',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
};

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  round: 999,
};

export const fonts = {
  // Serif face used only for the VY wordmark
  brand: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
};

export const typography = {
  display: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, color: colors.text },
  h1: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3, color: colors.text },
  h2: { fontSize: 20, fontWeight: '800', color: colors.text },
  h3: { fontSize: 17, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, fontWeight: '400', color: colors.text, lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontWeight: '700', color: colors.text },
  small: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.2 },
};

export const shadows = {
  none: {},
  card: {
    shadowColor: '#0B1F4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  raised: {
    shadowColor: '#0B1F4B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    shadowColor: '#1F6BFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
};

/** Tone → { main, soft } color pairs used by badges, icons and cards. */
export const tones = {
  primary: { main: colors.primary, soft: colors.primarySoft },
  success: { main: colors.success, soft: colors.successSoft },
  warning: { main: colors.warning, soft: colors.warningSoft },
  danger: { main: colors.danger, soft: colors.dangerSoft },
  info: { main: colors.info, soft: colors.infoSoft },
  neutral: { main: colors.neutral, soft: colors.neutralSoft },
};

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

export default { colors, spacing, radii, typography, shadows, tones, fonts };
