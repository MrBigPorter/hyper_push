// ==========================================
// HyperPush — App Detail Page
// Tabs: Deployments / Releases / Access Keys
// ==========================================

import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import {
  ArrowLeft,
  Smartphone,
  Layers,
  Package,
  KeyRound,
  ExternalLink,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Card } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  Deployment,
  Release,
  AccessKey,
} from '@app/types/models';

// ─── Mock Data ───────────────────────────────

const mockDeployments: Deployment[] = [
  {
    id: 'd1',
    name: 'Staging',
    appId: 'app-1',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-05-25T00:00:00Z',
  },
  {
    id: 'd2',
    name: 'Production',
    appId: 'app-1',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-05-26T00:00:00Z',
  },
];

const mockReleases: Release[] = [
  {
    id: 'r1',
    appVersion: '1.2.0',
    deploymentId: 'd2',
    label: 'v5',
    hash: 'a1b2c3d4e5f6...',
    status: 'active',
    size: 245000,
    isMandatory: false,
    isDisabled: false,
    rollout: 100,
    description: 'Bug fixes and performance improvements',
    releasedBy: 'john@example.com',
    createdAt: '2025-05-26T08:00:00Z',
  },
  {
    id: 'r2',
    appVersion: '1.1.0',
    deploymentId: 'd2',
    label: 'v4',
    hash: 'f6e5d4c3b2a1...',
    status: 'active',
    size: 210000,
    isMandatory: true,
    isDisabled: false,
    rollout: 100,
    description: 'New onboarding flow',
    releasedBy: 'john@example.com',
    createdAt: '2025-05-20T00:00:00Z',
  },
  {
    id: 'r3',
    appVersion: '1.0.0',
    deploymentId: 'd1',
    label: 'v3',
    hash: 'xyz789...',
    status: 'rolled_back',
    size: 180000,
    isMandatory: false,
    isDisabled: true,
    rollout: 50,
    description: 'Initial release',
    releasedBy: 'jane@example.com',
    createdAt: '2025-05-10T00:00:00Z',
  },
];

const mockAccessKeys: AccessKey[] = [
  {
    id: 'ak1',
    name: 'CI Deploy Key',
    key: 'hp_dep_abc123...',
    keyType: 'deployment',
    deploymentId: 'd2',
    active: true,
    createdAt: '2025-03-01T00:00:00Z',
    expiresAt: '2026-03-01T00:00:00Z',
    lastUsed: '2025-05-26T06:00:00Z',
  },
  {
    id: 'ak2',
    name: 'Dev View Key',
    key: 'hp_view_xyz789...',
    keyType: 'viewer',
    deploymentId: null,
    active: true,
    createdAt: '2025-04-15T00:00:00Z',
    expiresAt: null,
    lastUsed: '2025-05-25T12:00:00Z',
  },
];

// ─── Helpers ─────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─── Component ───────────────────────────────

export function AppDetailPage() {
  const navigate = useNavigate();
  const params = useParams({ from: '/dashboard/codepush/$appId' });
  const [isLoading] = useState(false);
  const [activeDeployment, setActiveDeployment] = useState<string | null>(null);

  // Filter releases by selected deployment
  const filteredReleases = activeDeployment
    ? mockReleases.filter((r) => r.deploymentId === activeDeployment)
    : mockReleases;

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

      {/* App Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700">
          <Smartphone className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            My App
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            App ID: {params.appId} · Platform: iOS
          </p>
        </div>
      </div>

      {/* ─── Tabs ─────────────────────────── */}
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

        {/* ── Deployments Tab ───────────── */}
        <TabsContent value="deployments" className="mt-4">
          <Card padding="lg">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {mockDeployments.map((dep) => (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-dark-700"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {dep.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {dep.name === 'Production'
                            ? 'Live'
                            : 'Testing'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Created{' '}
                        {new Date(dep.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveDeployment(dep.id)}
                    >
                      <ExternalLink className="mr-1 h-4 w-4" />
                      View Releases
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── Releases Tab ──────────────── */}
        <TabsContent value="releases" className="mt-4">
          <Card padding="lg">
            {/* Deployment Filter */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Filter:
              </span>
              {['All', ...mockDeployments.map((d) => d.name)].map(
                (name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() =>
                      setActiveDeployment(
                        name === 'All'
                          ? null
                          : mockDeployments.find(
                                (d) => d.name === name,
                              )?.id ?? null,
                      )
                    }
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                      (name === 'All' && !activeDeployment) ||
                      (name !== 'All' &&
                        activeDeployment ===
                          mockDeployments.find(
                            (d) => d.name === name,
                          )?.id)
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-800 dark:text-gray-400 dark:hover:bg-dark-700'
                    }`}
                  >
                    {name}
                  </button>
                ),
              )}
            </div>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filteredReleases.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No releases yet for this deployment.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredReleases.map((release) => (
                  <div
                    key={release.id}
                    className="rounded-lg border border-gray-200 p-4 dark:border-dark-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">
                          {release.label}
                        </span>
                        <Badge
                          variant={
                            release.status === 'active'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {release.status === 'active'
                            ? 'Active'
                            : 'Rolled Back'}
                        </Badge>
                        {release.isMandatory && (
                          <Badge
                            variant="destructive"
                            className="text-xs"
                          >
                            Mandatory
                          </Badge>
                        )}
                        {release.isDisabled && (
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Package className="h-3 w-3" />
                        {formatBytes(release.size)}
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      App v{release.appVersion} · Rollout:{' '}
                      {release.rollout}%
                    </p>

                    {release.description && (
                      <p className="mt-1 text-sm text-gray-500 italic dark:text-gray-400">
                        "{release.description}"
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                      <span>
                        <RotateCcw className="mr-1 inline-block h-3 w-3" />
                        {release.releasedBy}
                      </span>
                      <span>
                        {new Date(release.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── Access Keys Tab ───────────── */}
        <TabsContent value="access-keys" className="mt-4">
          <Card padding="lg">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {mockAccessKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-dark-700"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {key.name}
                        </span>
                        <Badge
                          variant={
                            key.keyType === 'deployment'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {key.keyType}
                        </Badge>
                        {key.active ? (
                          <ToggleRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <code className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                        {key.key}
                      </code>
                      <p className="mt-1 text-xs text-gray-400">
                        Created{' '}
                        {new Date(key.createdAt).toLocaleDateString()}
                        {key.lastUsed &&
                          ` · Last used ${new Date(key.lastUsed).toLocaleDateString()}`}
                        {key.expiresAt &&
                          ` · Expires ${new Date(key.expiresAt).toLocaleDateString()}`}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      Revoke
                    </Button>
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
