// ==========================================
// HyperPush — CodePush Route
// ==========================================

import { createRoute } from '@tanstack/react-router';
import { Route as DashboardRoute } from '../dashboard';
import { CodePushPage } from './CodePushPage';

export const Route = createRoute({
  getParentRoute: () => DashboardRoute,
  path: 'codepush',
  component: CodePushPage,
});
