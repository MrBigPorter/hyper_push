// ==========================================
// HyperPush — App Detail Page
// Tabs: Deployments / Releases / Access Keys
// ==========================================

import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useQuery } from '@apollo/client/react';
import {
  ArrowLeft,
  Smartphone,
  Layers,
  Package,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import { Card } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CODEPUSH_APPS,
  CODEPUSH_DEPLOYMENTS,
  CODEPUSH_RELEASE_HISTORY,
  CODEPUSH_ACCESS_KEYS,
} from '@app/lib/graphql';

// ─── Helpers ─────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

// ─── Component ───────────────────────────────

export function AppDetailPage() {
  const navigate = useNavigate();
  const params = useParams({ from: '/dashboard/codepush/$appId' });
  const serverId = params.appId;

  const { data: appsData, loading: appsLoading } = useQuery(CODEPUSH_APPS, {
    variables: { serverId },
  });

  const [activeDeployment, setActiveDeployment] = useState<string | null>(null);

  const apps = (Array.isArray((appsData as Record<string, unknown>)?.codepushApps) ? (appsData as Record<string, unknown>).codepushApps : []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate({ to: '/dashboard/codepush' })}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Apps
      </button>

      {appsLoading ? (
        <Card padding="lg">
          <div className="flex items-center justify-center py-8">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        </Card>
      ) : apps.length === 0 ? (
        <Card padding="lg">
          <div className="py-12 text-center">
            <Smartphone className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-gray-400 dark:text-gray-500">
              No apps found on this server
            </p>
          </div>
        </Card>
      ) : (
        apps.map((app) => (
          <AppDetailCard
            key={String(app.name ?? app.id ?? '')}
            app={app}
            serverId={serverId}
            activeDeployment={activeDeployment}
            onSetActiveDeployment={setActiveDeployment}
          />
        ))
      )}
    </div>
  );
}

function AppDetailCard({
  app,
  serverId,
  activeDeployment,
  onSetActiveDeployment,
}: {
  app: Record<string, unknown>;
  serverId: string;
  activeDeployment: string | null;
  onSetActiveDeployment: (id: string | null) => void;
}) {
  const appName = String(app.name ?? '');
  const appPlatform = String(app.os ?? app.platform ?? 'N/A');

  const { data: deploymentsData, loading: deploysLoading } = useQuery(CODEPUSH_DEPLOYMENTS, {
    variables: { serverId, appName },
  });

  const { data: releasesData, loading: releasesLoading } = useQuery(
    CODEPUSH_RELEASE_HISTORY,
    {
      variables: {
        serverId,
        appName,
        deploymentName: activeDeployment ?? '',
      },
      skip: !activeDeployment,
    },
  );

  const { data: accessKeysData, loading: keysLoading } = useQuery(CODEPUSH_ACCESS_KEYS, {
    variables: { serverId },
  });

  const deployments = (Array.isArray((deploymentsData as Record<string, unknown>)?.codepushDeployments)
    ? (deploymentsData as Record<string, unknown>).codepushDeployments
    : []) as Record<string, unknown>[];

  const releases = (Array.isArray((releasesData as Record<string, unknown>)?.codepushReleaseHistory)
    ? (releasesData as Record<string, unknown>).codepushReleaseHistory
    : []) as Record<string, unknown>[];

  const accessKeys = (Array.isArray((accessKeysData as Record<string, unknown>)?.codepushAccessKeys)
    ? (accessKeysData as Record<string, unknown>).codepushAccessKeys
    : []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      {/* App Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700">
          <Smartphone className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {appName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Platform: {appPlatform}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="deployments" className="w-full">
        <TabsList>
          <TabsTrigger value="deployments">
            <Layers className="mr-2 h-4 w-4" />
            Deployments
          </TabsTrigger>
          <TabsTrigger value="releases">
            <Package className="mr-2 h-4 w-4" />
            Releases
          </TabsTrigger>
          <TabsTrigger value="access-keys">
            <KeyRound className="mr-2 h-4 w-4" />
            Access Keys
          </TabsTrigger>
        </TabsList>

        {/* Deployments Tab */}
        <TabsContent value="deployments" className="mt-4">
          <Card padding="lg">
            {deploysLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : deployments.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No deployments yet.
              </p>
            ) : (
              <div className="space-y-4">
                {deployments.map((dep: Record<string, unknown>, idx: number) => (
                  <div
                    key={String(dep.name ?? idx)}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-dark-700"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {String(dep.name ?? '')}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {String(dep.name ?? '') === 'Production'
                            ? 'Live'
                            : 'Testing'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onSetActiveDeployment(String(dep.name ?? ''))}
                    >
                      <Package className="mr-1 h-4 w-4" />
                      View Releases
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Releases Tab */}
        <TabsContent value="releases" className="mt-4">
          <Card padding="lg">
            {/* Deployment Filter */}
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Filter:
              </span>
              {['All', ...deployments.map((d) => String(d.name ?? ''))].map(
                (name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() =>
                      onSetActiveDeployment(
                        name === 'All' ? null : name,
                      )
                    }
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                      (name === 'All' && !activeDeployment) ||
                      activeDeployment === name
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-800 dark:text-gray-400 dark:hover:bg-dark-700'
                    }`}
                  >
                    {name}
                  </button>
                ),
              )}
            </div>

            {releasesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : !activeDeployment ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Select a deployment to view releases.
              </p>
            ) : releases.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No releases yet for this deployment.
              </p>
            ) : (
              <div className="space-y-3">
                {releases.map((release: Record<string, unknown>, idx: number) => {
                  const label = String(release.label ?? '');
                  const appVersion = String(release.appVersion ?? '');
                  const rollout = Number(release.rollout ?? 100);
                  const size = Number(release.size ?? release.packageSize ?? 0);
                  const isMandatory = Boolean(release.isMandatory);
                  const isDisabled = Boolean(release.isDisabled);
                  const description = release.description
                    ? String(release.description)
                    : null;
                  const releasedBy = String(release.releasedBy ?? '');
                  const createdAt = String(release.createdAt ?? '');

                  return (
                    <div
                      key={label || idx}
                      className="rounded-lg border border-gray-200 p-4 dark:border-dark-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">
                            {label}
                          </span>
                          <Badge
                            variant={
                              (release.status as string) === 'active' ||
                              release.active === true
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {release.active === true || release.status === 'active'
                              ? 'Active'
                              : 'Inactive'}
                          </Badge>
                          {isMandatory && (
                            <Badge variant="destructive" className="text-xs">
                              Mandatory
                            </Badge>
                          )}
                          {isDisabled && (
                            <Badge variant="outline" className="text-xs">
                              Disabled
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Package className="h-3 w-3" />
                          {formatBytes(size)}
                        </div>
                      </div>

                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        App v{appVersion} · Rollout: {rollout}%
                      </p>

                      {description && (
                        <p className="mt-1 text-sm text-gray-500 italic dark:text-gray-400">
                          "{description}"
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                        <span>
                          <RotateCcw className="mr-1 inline-block h-3 w-3" />
                          {releasedBy}
                        </span>
                        {createdAt && (
                          <span>{new Date(createdAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Access Keys Tab */}
        <TabsContent value="access-keys" className="mt-4">
          <Card padding="lg">
            {keysLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : accessKeys.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No access keys yet.
              </p>
            ) : (
              <div className="space-y-4">
                {accessKeys.map((key: Record<string, unknown>, idx: number) => (
                  <div
                    key={String(key.name ?? idx)}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-dark-700"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {String(key.friendlyName ?? key.name ?? '')}
                        </span>
                        <Badge variant="default" className="text-xs">
                          {String(key.keyType ?? 'deployment')}
                        </Badge>
                      </div>
                      <code className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                        {String(key.key ?? '')}
                      </code>
                      {!!key.createdAt && (
                        <p className="mt-1 text-xs text-gray-400">
                          Created{' '}
                          {new Date(String(key.createdAt)).toLocaleDateString()}
                          {!!key.expiresAt &&
                            ` · Expires ${new Date(String(key.expiresAt)).toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
