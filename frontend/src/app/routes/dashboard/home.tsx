// ==========================================
// HyperPush — Dashboard Home Route
// ==========================================

import { createRoute } from '@tanstack/react-router';
import { Route as DashboardRoute } from '../dashboard';
import { DashboardHome } from './DashboardHome';

export const Route = createRoute({
  getParentRoute: () => DashboardRoute,
  path: '/',
  component: DashboardHome,
});
