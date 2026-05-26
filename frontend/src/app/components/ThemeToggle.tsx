// ==========================================
// HyperPush — Theme Toggle Button
// Sun/Moon icon that dispatches toggleTheme
// ==========================================

import { Sun, Moon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { toggleTheme } from '@app/store/slices/themeSlice';

export function ThemeToggle() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.theme.mode);

  return (
    <button
      type="button"
      onClick={() => dispatch(toggleTheme())}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-dark-700 dark:hover:text-gray-200"
      aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {mode === 'light' ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
