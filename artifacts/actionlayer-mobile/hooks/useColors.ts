import colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';

export function useColors() {
  let appTheme = 'light';
  try {
    const app = useApp();
    if (app && app.theme) {
      appTheme = app.theme;
    }
  } catch (e) {
    // If used outside AppProvider, default to light
  }

  const palette =
    appTheme === 'dark' && 'dark' in colors
      ? colors.dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}
