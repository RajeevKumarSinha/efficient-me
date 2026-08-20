import { create } from 'zustand';
import { darkTheme, lightTheme, Theme } from '../theme/theme';

interface ThemeState {
  isDarkMode: boolean;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: true,
  theme: darkTheme,

  toggleTheme: () => {
    set((state) => {
      const nextIsDark = !state.isDarkMode;
      return {
        isDarkMode: nextIsDark,
        theme: nextIsDark ? darkTheme : lightTheme,
      };
    });
  },

  setTheme: (isDark: boolean) => {
    set({
      isDarkMode: isDark,
      theme: isDark ? darkTheme : lightTheme,
    });
  },
}));
