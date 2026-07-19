import { useThemeStore } from '@/store/useThemeStore';

export function useTheme() {
  const { colors, isDark, toggleTheme } = useThemeStore();
  return { colors, isDark, toggleTheme };
}
