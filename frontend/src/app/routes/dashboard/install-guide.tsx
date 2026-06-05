// ==========================================
// HyperPush — Install Guide Route
// ==========================================

import { createRoute } from '@tanstack/react-router';
import { Route as DashboardRoute } from '../dashboard';
import { InstallGuidePage } from './InstallGuidePage';

export const Route = createRoute({
  getParentRoute: () => DashboardRoute,
  path: 'install-guide',
  component: InstallGuidePage,
});
