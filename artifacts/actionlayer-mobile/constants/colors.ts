/**
 * Apple Liquid Glass semantic design tokens.
 * Inspired by open-glass-ui (https://github.com/moekoelueker/open-glass-ui.git).
 * Monochromatic frosted dark materials, specular rim highlights, and ultra-crisp typography.
 */

const liquidGlassDark = {
  text: '#FFFFFF',
  tint: '#FFFFFF',
  background: 'transparent',
  foreground: '#FFFFFF',
  card: 'rgba(16, 20, 28, 0.45)',
  cardForeground: '#FFFFFF',
  primary: 'rgba(255, 255, 255, 0.92)',
  primaryForeground: '#0A0D14',
  secondary: 'rgba(255, 255, 255, 0.10)',
  secondaryForeground: '#FFFFFF',
  muted: 'rgba(255, 255, 255, 0.06)',
  mutedForeground: 'rgba(255, 255, 255, 0.65)',
  accent: 'rgba(255, 255, 255, 0.14)',
  accentForeground: '#FFFFFF',
  border: 'rgba(255, 255, 255, 0.16)',
  input: 'rgba(255, 255, 255, 0.10)',
  destructive: '#F87171',
  destructiveForeground: '#FFFFFF',
  success: '#34D399',
  warning: '#FBBF24',
  risk: '#F87171',
  info: '#60A5FA',
  overlay: 'rgba(0, 0, 0, 0.70)',
};

const liquidGlassLight = {
  text: '#000000',
  tint: '#000000',
  background: 'transparent',
  foreground: '#000000',
  card: 'rgba(255, 255, 255, 0.55)',
  cardForeground: '#000000',
  primary: 'rgba(0, 0, 0, 0.9)',
  primaryForeground: '#FFFFFF',
  secondary: 'rgba(0, 0, 0, 0.08)',
  secondaryForeground: '#000000',
  muted: 'rgba(0, 0, 0, 0.05)',
  mutedForeground: 'rgba(0, 0, 0, 0.65)',
  accent: 'rgba(0, 0, 0, 0.10)',
  accentForeground: '#000000',
  border: 'rgba(0, 0, 0, 0.15)',
  input: 'rgba(0, 0, 0, 0.08)',
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  success: '#10B981',
  warning: '#EA580C',
  risk: '#EF4444',
  info: '#3B82F6',
  overlay: 'rgba(255, 255, 255, 0.70)',
};

const colors = {
  light: liquidGlassLight,
  dark: liquidGlassDark,
  radius: 16,
};

export default colors;
