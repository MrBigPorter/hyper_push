// ==========================================
// HyperPush — CodePush Management Page
// GraphQL queries — write your own
// ==========================================

import { Card, CardHeader, Button } from '@app/components/ui';
import { Plus } from 'lucide-react';

export function CodePushPage() {
  return (
    <div className="space-y-6">
      <CardHeader
        title="CodePush Apps"
        description="Manage CodePush apps, deployments, and releases"
        action={
          <Button variant="primary" size="sm" disabled>
            <Plus className="mr-1 h-4 w-4" />
            Create App
          </Button>
        }
      />

      <Card padding="none">
        {/*
          TODO: Write your GraphQL codepush apps query here
        */}
        <div className="py-16 text-center">
          <p className="text-gray-400 dark:text-gray-500">
            No CodePush apps yet
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Write the CodePush resolver first
          </p>
        </div>
      </Card>
    </div>
  );
}
