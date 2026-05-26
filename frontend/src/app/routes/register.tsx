// ==========================================
// HyperPush — Register Route
// ==========================================

import { createRoute } from '@tanstack/react-router';
import { Route as RootRoute } from './__root';
import { RegisterPage } from './RegisterPage';

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/register',
  component: RegisterPage,
});
