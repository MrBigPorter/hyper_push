// ==========================================
// HyperPush — Sidebar Navigation
// ==========================================

import { useAppDispatch, useAppSelector } from '@app/hooks';
import { logout } from '@app/store/slices/authSlice';
import { useLocation, useNavigate } from '@tanstack/react-router';
import clsx from 'clsx';
import {
  BookOpen,
  Cloud,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Server,
  Settings,
  Terminal,
} from 'lucide-react';
import { useCallback } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: typeof Server;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Install Guide', path: '/dashboard/install-guide', icon: BookOpen },
  { label: 'Servers', path: '/dashboard/servers', icon: Server },
  { label: 'API Keys', path: '/dashboard/api-keys', icon: KeyRound },
  { label: 'Audit Logs', path: '/dashboard/audit-logs', icon: ScrollText },
  { label: 'CodePush', path: '/dashboard/codepush', icon: Cloud },
  { label: 'Settings', path: '/dashboard/settings', icon: Settings },
];

const MONITOR_URL =
  import.meta.env.VITE_MONITOR_URL ?? 'https://monitor.joyminis.com';

// Derive API base URL from the GraphQL endpoint (VITE_API_URL), falling back to same-origin
const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/graphql\/?$/, '')
  : '';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate({ to: '/' });
  };

  const handleOpenCodePushLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/grafana-token`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to get Grafana token');
      const data = await res.json();

      // Build Grafana Explore URL with pre-filtered LogQL query for CodePush servers
      const exploreState = {
        datasource: 'Loki',
        queries: [
          {
            refId: 'A',
            expr: '{container=~".*codepush.*"}',
          },
        ],
        range: {
          from: 'now-1h',
          to: 'now',
        },
      };
      const leftParam = encodeURIComponent(JSON.stringify(exploreState));
      const exploreUrl = `${MONITOR_URL}/explore?orgId=1&left=${leftParam}&token=${data.token}`;
      window.open(exploreUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Fallback
      window.open(MONITOR_URL, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white dark:border-dark-700 dark:bg-dark-900">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-5 dark:border-dark-700">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
          <Cloud className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">HyperPush</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Management Console</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate({ to: item.path })}
              className={clsx(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.path)
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-800',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* External: CodePush Logs (SSO) */}
        <button
          type="button"
          onClick={handleOpenCodePushLogs}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-800"
        >
          <Terminal className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>CodePush Logs</span>
        </button>
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 p-3 dark:border-dark-700">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-800"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
