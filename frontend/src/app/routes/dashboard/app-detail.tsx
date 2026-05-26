// ==========================================
// HyperPush — App Detail Route
// ==========================================

import { createRoute } from '@tanstack/react-router';
import { Route as DashboardRoute } from '../dashboard';
import { AppDetailPage } from './AppDetailPage';

export const Route = createRoute({
  getParentRoute: () => DashboardRoute,
  path: 'codepush/$appId',
  component: AppDetailPage,
});
