// ==========================================
// HyperPush — Servers Route
// ==========================================

import { createRoute } from '@tanstack/react-router';
import { Route as DashboardRoute } from '../dashboard';
import { ServersPage } from './ServersPage';

export const Route = createRoute({
  getParentRoute: () => DashboardRoute,
  path: 'servers',
  component: ServersPage,
});
