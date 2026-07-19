import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, LightColors, type ColorScheme } from '@/theme/colors';

interface ThemeState {
  isDark: boolean;
  colors: ColorScheme;
  toggleTheme: () => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: true,
  colors: DarkColors,

  toggleTheme: async () => {
    const next = !get().isDark;
    set({ isDark: next, colors: next ? DarkColors : LightColors });
    await AsyncStorage.setItem('theme', next ? 'dark' : 'light');
  },

  loadTheme: async () => {
    const saved = await AsyncStorage.getItem('theme');
    const isDark = saved !== 'light';
    set({ isDark, colors: isDark ? DarkColors : LightColors });
  },
}));
