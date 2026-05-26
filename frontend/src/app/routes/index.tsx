// ==========================================
// HyperPush — Index Route (Login Page)
// ==========================================

import { createRoute } from '@tanstack/react-router';
import { Route as RootRoute } from './__root';
import { LoginPage } from './LoginPage';

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: LoginPage,
});
