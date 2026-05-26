// ==========================================
// HyperPush — Dashboard Header
// ==========================================

import { useAppSelector } from '@app/hooks';
import { User, ChevronDown } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-dark-700 dark:bg-dark-900">
      {/* Breadcrumb / Page title area — filled by each page */}
      <div />

      {/* Right side: theme toggle + user info */}
      <div className="flex items-center gap-4">
        <ThemeToggle />

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {user?.name ?? user?.email ?? 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {user?.role ?? ''}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-700">
            <User className="h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
