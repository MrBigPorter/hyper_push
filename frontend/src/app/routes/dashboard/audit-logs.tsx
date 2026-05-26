// ==========================================
// HyperPush — Audit Logs Route
// ==========================================

import { createRoute } from '@tanstack/react-router';
import { Route as DashboardRoute } from '../dashboard';
import { AuditLogsPage } from './AuditLogsPage';

export const Route = createRoute({
  getParentRoute: () => DashboardRoute,
  path: 'audit-logs',
  component: AuditLogsPage,
});
