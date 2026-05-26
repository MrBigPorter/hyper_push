// ==========================================
// HyperPush — Settings Route
// ==========================================

import { createRoute } from '@tanstack/react-router';
import { Route as DashboardRoute } from '../dashboard';
import { SettingsPage } from './SettingsPage';

export const Route = createRoute({
  getParentRoute: () => DashboardRoute,
  path: 'settings',
  component: SettingsPage,
});
