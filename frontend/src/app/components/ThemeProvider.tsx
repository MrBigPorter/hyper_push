// ==========================================
// HyperPush — Theme Provider
// Syncs Redux theme state → <html>.classList
// so Tailwind dark: variants activate based on
// class strategy rather than OS media query.
// ==========================================

import { type ReactNode, useEffect } from 'react';
import { useAppSelector } from '@app/hooks';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const mode = useAppSelector((state) => state.theme.mode);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode]);

  return <>{children}</>;
}
