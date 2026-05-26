// ==========================================
// HyperPush — API Keys Management Page
// GraphQL queries — write your own
// ==========================================

import { Card, CardHeader, Button } from '@app/components/ui';
import { Plus } from 'lucide-react';

export function ApiKeysPage() {
  return (
    <div className="space-y-6">
      <CardHeader
        title="API Keys"
        description="Manage API access keys"
        action={
          <Button variant="primary" size="sm" disabled>
            <Plus className="mr-1 h-4 w-4" />
            Create Key
          </Button>
        }
      />

      <Card padding="none">
        {/*
          TODO: Write your GraphQL apiKeys query here
        */}
        <div className="py-16 text-center">
          <p className="text-gray-400 dark:text-gray-500">
            No API keys yet
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Write the ApiKeys resolver first
          </p>
        </div>
      </Card>
    </div>
  );
}
