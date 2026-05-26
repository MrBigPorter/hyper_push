// ==========================================
// HyperPush — Audit Logs Page
// GraphQL queries — write your own
// ==========================================

import { Card, CardHeader } from '@app/components/ui';
import { ScrollText, Filter } from 'lucide-react';

export function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <CardHeader
        title="Audit Logs"
        description="System operation records"
        action={
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            disabled
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
        }
      />

      <Card padding="none">
        {/*
          TODO: Write your GraphQL auditLogs query here
        */}
        <div className="py-16 text-center">
          <ScrollText className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="mt-4 text-gray-400 dark:text-gray-500">
            No audit logs yet
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Write the AuditLog resolver first
          </p>
        </div>
      </Card>
    </div>
  );
}
