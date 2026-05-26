// ==========================================
// HyperPush — Dashboard Route (Layout)
// ==========================================

import { createRoute } from '@tanstack/react-router';
import { Route as RootRoute } from './__root';
import { DashboardLayout } from './DashboardLayout';

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/dashboard',
  component: DashboardLayout,
});
