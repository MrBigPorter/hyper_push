// ==========================================
// HyperPush — CodePush Management Page
// ==========================================

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@apollo/client/react';
import { Card, CardHeader, Button } from '@app/components/ui';
import { Plus, Smartphone, Server } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { GET_SERVERS } from '@app/lib/graphql';
import type { Server as ServerModel } from '@app/types/models';
import type { ServersResponseData } from '@app/types/graphql';

export function CodePushPage() {
  const navigate = useNavigate();
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  const { data, loading, error } = useQuery(GET_SERVERS);

  const servers: ServerModel[] = (data as ServersResponseData | undefined)?.getServers ?? [];

  return (
    <div className="space-y-6">
      <CardHeader
        title="CodePush Apps"
        description="Manage CodePush apps, deployments, and releases"
        action={
          <Button
            variant="primary"
            size="sm"
            disabled={servers.length === 0}
            onClick={() => {
              if (servers.length === 1) {
                setSelectedServerId(servers[0].id);
              }
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Create App
          </Button>
        }
      />

      {loading ? (
        <Card padding="lg">
          <div className="flex items-center justify-center py-8">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        </Card>
      ) : error ? (
        <Card padding="lg">
          <p className="text-center text-red-500">
            Failed to load servers: {error.message}
          </p>
        </Card>
      ) : servers.length === 0 ? (
        <Card padding="lg">
          <div className="py-12 text-center">
            <Server className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-gray-400 dark:text-gray-500">
              No CodePush servers connected
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Add a server first in the Servers page.
            </p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => navigate({ to: '/dashboard/servers' })}
            >
              Go to Servers
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <Card
              key={server.id}
              padding="lg"
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedServerId(server.id)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/20">
                  <Server className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {server.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {server.baseUrl}
                  </p>
                </div>
                <Badge variant={server.isOnline ? 'default' : 'secondary'}>
                  {server.isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate({ to: '/dashboard/codepush/$appId', params: { appId: server.id } });
                }}
                className="mt-4 w-full rounded-lg border border-gray-200 p-3 text-center text-sm text-gray-600 hover:bg-gray-50 dark:border-dark-700 dark:text-gray-400 dark:hover:bg-dark-800"
              >
                <Smartphone className="mr-1 inline-block h-4 w-4" />
                View Apps
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
