// ==========================================
// HyperPush — Server Detail Route
// ==========================================

import { createRoute } from '@tanstack/react-router';
import { Route as DashboardRoute } from '../dashboard';
import { ServerDetailPage } from './ServerDetailPage';

export const Route = createRoute({
  getParentRoute: () => DashboardRoute,
  path: 'servers/$id',
  component: ServerDetailPage,
});
