// ==========================================
// HyperPush — Audit Logs Page
// ==========================================

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Card, CardHeader, Button } from '@app/components/ui';
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import { GET_AUDIT_LOGS } from '@app/lib/graphql';
import { Badge } from '@/components/ui/badge';
import type { AuditLog } from '@app/types/models';
import type { AuditLogsResponseData } from '@app/types/graphql';

const PAGE_SIZE = 50;

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState<string | undefined>();
  const [actionFilter, setActionFilter] = useState<string | undefined>();

  const { data, loading, error } = useQuery(GET_AUDIT_LOGS, {
    variables: {
      filter: {
        entity: entityFilter || undefined,
        action: actionFilter || undefined,
        page,
        pageSize: PAGE_SIZE,
      },
    },
  });

  const typedData = data as AuditLogsResponseData | undefined;
  const auditLogs: AuditLog[] = typedData?.getAuditLogs?.items ?? [];
  const pagination = typedData?.getAuditLogs?.pagination;

  const handleEntityFilterChange = (value: string) => {
    setEntityFilter(value || undefined);
    setPage(1);
  };

  const handleActionFilterChange = (value: string) => {
    setActionFilter(value || undefined);
    setPage(1);
  };

  const actionColors: Record<string, string> = {
    create: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    delete: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    login: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    logout: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
    api_call: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  };

  return (
    <div className="space-y-6">
      <CardHeader
        title="Audit Logs"
        description="System operation records"
        action={
          <div className="flex items-center gap-2">
            <select
              value={entityFilter ?? ''}
              onChange={(e) => handleEntityFilterChange(e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
            >
              <option value="">All Entities</option>
              <option value="user">User</option>
              <option value="server">Server</option>
              <option value="api_key">API Key</option>
              <option value="app">App</option>
              <option value="deployment">Deployment</option>
              <option value="release">Release</option>
            </select>
            <select
              value={actionFilter ?? ''}
              onChange={(e) => handleActionFilterChange(e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="api_call">API Call</option>
            </select>
          </div>
        }
      />

      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-red-500">Failed to load audit logs: {error.message}</p>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="py-16 text-center">
            <ScrollText className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-gray-400 dark:text-gray-500">
              No audit logs yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-dark-700">
            {auditLogs.map((log) => (
              <div key={log.id} className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      actionColors[log.action] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {log.action}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {log.entity}
                  </Badge>
                  {log.detail && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                      {log.detail}
                    </p>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(log.createdAt).toLocaleString()}
                  {log.ip && ` · IP: ${log.ip}`}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 dark:border-dark-700">
            <p className="text-xs text-gray-500">
              Showing {(pagination.page - 1) * pagination.pageSize + 1}–
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="px-2 text-xs text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
