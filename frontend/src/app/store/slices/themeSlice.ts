// ==========================================
// HyperPush — Theme Redux Slice
// Persists to localStorage, falls back to OS
// prefers-color-scheme
// ==========================================

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ThemeMode } from '@app/types';

const THEME_STORAGE_KEY = 'hyperpush_theme';

/** Read saved theme from localStorage, fallback to system preference */
function loadTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export interface ThemeState {
  mode: ThemeMode;
}

const initialState: ThemeState = {
  mode: loadTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_STORAGE_KEY, state.mode);
    },
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
      localStorage.setItem(THEME_STORAGE_KEY, state.mode);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
