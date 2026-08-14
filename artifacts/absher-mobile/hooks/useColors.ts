import { useTheme } from '@/context/ThemeContext';
import colors from '@/constants/colors';

/**
 * Returns the design tokens for the currently active theme.
 * Uses the manual ThemeContext preference (light | dark | system).
 */
export function useColors() {
  const { resolved } = useTheme();
  const palette = resolved === 'dark' ? colors.dark : colors.light;
  return { ...palette, ...colors.static };
}
