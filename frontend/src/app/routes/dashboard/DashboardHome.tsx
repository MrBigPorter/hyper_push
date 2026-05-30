// ==========================================
// HyperPush — Dashboard Home (Overview)
// ==========================================

import { useQuery } from '@apollo/client/react';
import { Card } from '@app/components/ui';
import { Server, KeyRound, ScrollText, Cloud } from 'lucide-react';
import { GET_SERVERS, GET_API_KEYS, GET_AUDIT_LOGS } from '@app/lib/graphql';
import { useNavigate } from '@tanstack/react-router';
import type { ServersResponseData, ApiKeysResponseData, AuditLogsResponseData } from '@app/types/graphql';

interface StatCardProps {
  title: string;
  value: string;
  icon: typeof Server;
  color: string;
  href?: string;
}

function StatCard({ title, value, icon: Icon, color, href }: StatCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      padding="lg"
      className={href ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
      onClick={href ? () => navigate({ to: href }) : undefined}
    >
      <div className="flex items-center gap-4">
        <div className={`rounded-lg bg-gray-50 p-3 dark:bg-dark-700 ${color}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function DashboardHome() {
  const { data: serversData, loading: serversLoading } = useQuery(GET_SERVERS);
  const { data: apiKeysData, loading: apiKeysLoading } = useQuery(GET_API_KEYS);
  const { data: auditLogsData, loading: auditLogsLoading } = useQuery(GET_AUDIT_LOGS, {
    variables: { filter: { page: 1, pageSize: 1 } },
  });

  const serverCount = (serversData as ServersResponseData | undefined)?.getServers?.length ?? '--';
  const apiKeyCount = (apiKeysData as ApiKeysResponseData | undefined)?.getApiKeys?.length ?? '--';
  const auditLogCount = (auditLogsData as AuditLogsResponseData | undefined)?.getAuditLogs?.pagination?.total ?? '--';
  const codepushAppsCount = '--'; // Requires selected server

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          System Overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Servers"
          value={serversLoading ? '...' : String(serverCount)}
          icon={Server}
          color="text-blue-600"
          href="/dashboard/servers"
        />
        <StatCard
          title="API Keys"
          value={apiKeysLoading ? '...' : String(apiKeyCount)}
          icon={KeyRound}
          color="text-green-600"
          href="/dashboard/api-keys"
        />
        <StatCard
          title="Audit Logs"
          value={auditLogsLoading ? '...' : String(auditLogCount)}
          icon={ScrollText}
          color="text-purple-600"
          href="/dashboard/audit-logs"
        />
        <StatCard
          title="CodePush Apps"
          value={String(codepushAppsCount)}
          icon={Cloud}
          color="text-orange-600"
          href="/dashboard/codepush"
        />
      </div>

      {/* Recent Activity */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Recent Activity
        </h3>
        {auditLogsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              View detailed audit logs in the{' '}
              <a
                href="/dashboard/audit-logs"
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Audit Logs
              </a>{' '}
              section.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
