// ==========================================
// HyperPush — API Keys Route
// ==========================================

import { createRoute } from '@tanstack/react-router';
import { Route as DashboardRoute } from '../dashboard';
import { ApiKeysPage } from './ApiKeysPage';

export const Route = createRoute({
  getParentRoute: () => DashboardRoute,
  path: 'api-keys',
  component: ApiKeysPage,
});
