// ==========================================
// HyperPush — TanStack Router
// ==========================================

import { createRouter } from '@tanstack/react-router';
import { Route as RootRoute } from './routes/__root';
import { Route as DashboardRoute } from './routes/dashboard';
import { Route as DashboardApiKeysRoute } from './routes/dashboard/api-keys';
import { Route as DashboardAppDetailRoute } from './routes/dashboard/app-detail';
import { Route as DashboardAuditLogsRoute } from './routes/dashboard/audit-logs';
import { Route as DashboardCodepushRoute } from './routes/dashboard/codepush';
import { Route as DashboardHomeRoute } from './routes/dashboard/home';
import { Route as DashboardServerDetailRoute } from './routes/dashboard/server-detail';
import { Route as DashboardServersRoute } from './routes/dashboard/servers';
import { Route as DashboardSettingsRoute } from './routes/dashboard/settings';
import { Route as DashboardInstallGuideRoute } from './routes/dashboard/install-guide';
import { Route as IndexRoute } from './routes/index';
import { Route as RegisterRoute } from './routes/register';

const routeTree = RootRoute.addChildren([
  IndexRoute,
  RegisterRoute,
  DashboardRoute.addChildren([
    DashboardHomeRoute,
    DashboardServersRoute,
    DashboardServerDetailRoute,
    DashboardApiKeysRoute,
    DashboardAuditLogsRoute,
    DashboardCodepushRoute,
    DashboardAppDetailRoute,
    DashboardSettingsRoute,
    DashboardInstallGuideRoute,
  ]),
]);

export const router = createRouter({ routeTree });

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
