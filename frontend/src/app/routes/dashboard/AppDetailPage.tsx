// ==========================================
// HyperPush — App Detail Page
// Tabs: Deployments / Releases
// ==========================================

import { useMutation, useQuery } from '@apollo/client/react';
import { Button } from '@app/components/ui/Button';
import { Card } from '@app/components/ui/Card';
import {
  CODEPUSH_APPS,
  CODEPUSH_DEPLOYMENTS,
  CODEPUSH_RELEASE_HISTORY,
  PROMOTE_CODEPUSH_RELEASE,
  ROLLBACK_CODEPUSH_RELEASE,
  TRIGGER_CODEPUSH_RELEASE,
} from '@app/lib/graphql';
import { useNavigate, useParams } from '@tanstack/react-router';
import {
  ArrowLeft,
  Copy,
  Flame,
  Layers,
  Package,
  RotateCcw,
  Smartphone,
  Upload,
  Undo2,
  Pencil,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const serverId = params.appId;

  const { data: appsData, loading: appsLoading } = useQuery(CODEPUSH_APPS, {
    variables: { serverId },
  });

  const [activeDeployment, setActiveDeployment] = useState<string | null>(null);

  const apps = (
    Array.isArray((appsData as Record<string, unknown>)?.codepushApps)
      ? (appsData as Record<string, unknown>).codepushApps
      : []
  ) as Record<string, unknown>[];

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
            <p className="mt-4 text-gray-400 dark:text-gray-500">No apps found on this server</p>
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

  // ── Dialogs ──
  const [promoteDialog, setPromoteDialog] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [hotFixDialog, setHotFixDialog] = useState<{
    deploymentName: string;
    description: string;
  } | null>(null);
  const [hotFixLoading, setHotFixLoading] = useState(false);

  // ── Queries ──
  const { data: deploymentsData, loading: deploysLoading } = useQuery(CODEPUSH_DEPLOYMENTS, {
    variables: { serverId, appName },
  });

  const { data: releasesData, loading: releasesLoading } = useQuery(CODEPUSH_RELEASE_HISTORY, {
    variables: {
      serverId,
      appName,
      deploymentName: activeDeployment ?? '',
    },
    skip: !activeDeployment,
  });

  // ── Mutations ──
  const [promoteRelease] = useMutation(PROMOTE_CODEPUSH_RELEASE, {
    refetchQueries: [
      { query: CODEPUSH_RELEASE_HISTORY, variables: { serverId, appName, deploymentName: activeDeployment ?? '' } },
    ],
  });
  const [rollbackRelease] = useMutation(ROLLBACK_CODEPUSH_RELEASE, {
    refetchQueries: [
      { query: CODEPUSH_RELEASE_HISTORY, variables: { serverId, appName, deploymentName: activeDeployment ?? '' } },
    ],
  });
  const [triggerHotFix] = useMutation(TRIGGER_CODEPUSH_RELEASE);

  const deployments = (
    Array.isArray((deploymentsData as Record<string, unknown>)?.codepushDeployments)
      ? (deploymentsData as Record<string, unknown>).codepushDeployments
      : []
  ) as Record<string, unknown>[];

  const releases = (
    Array.isArray((releasesData as Record<string, unknown>)?.codepushReleaseHistory)
      ? (releasesData as Record<string, unknown>).codepushReleaseHistory
      : []
  ) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      {/* App Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-primary-700">
          <Smartphone className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{appName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Platform: {appPlatform}</p>
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
              <p className="py-8 text-center text-sm text-gray-400">No deployments yet.</p>
            ) : (
              <div className="space-y-4">
                {deployments.map((dep: Record<string, unknown>, idx: number) => {
                  const depKey = String(dep.key ?? '');
                  return (
                    <div
                      key={String(dep.name ?? idx)}
                      className="rounded-lg border border-gray-200 p-4 dark:border-dark-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {String(dep.name ?? '')}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {String(dep.name ?? '') === 'Production' ? 'Live' : 'Testing'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {String(dep.name ?? '') === 'Staging' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                setPromoteDialog({
                                  from: 'Staging',
                                  to: 'Production',
                                })
                              }
                            >
                              <Upload className="mr-1 h-4 w-4" />
                              Promote to Production
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onSetActiveDeployment(String(dep.name ?? ''))}
                          >
                            <Package className="mr-1 h-4 w-4" />
                            View Releases
                          </Button>
                        </div>
                      </div>
                      {depKey && (
                        <div className="mt-2 flex items-center gap-2">
                          <code className="flex-1 truncate rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-600 dark:bg-dark-800 dark:text-gray-400">
                            {depKey}
                          </code>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(depKey)}
                            className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-dark-700"
                            title="Copy deployment key"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Releases Tab */}
        <TabsContent value="releases" className="mt-4">
          <Card padding="lg">
            {/* Deployment Filter */}
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filter:</span>
              {['All', ...deployments.map((d) => String(d.name ?? ''))].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSetActiveDeployment(name === 'All' ? null : name)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    (name === 'All' && !activeDeployment) || activeDeployment === name
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-800 dark:text-gray-400 dark:hover:bg-dark-700'
                  }`}
                >
                  {name}
                </button>
              ))}
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
                  const description = release.description ? String(release.description) : null;
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
                              (release.status as string) === 'active' || release.active === true
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
                        {createdAt && <span>{new Date(createdAt).toLocaleString()}</span>}
                      </div>

                      {/* ── Action Buttons ── */}
                      <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-dark-700">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              await rollbackRelease({
                                variables: {
                                  serverId,
                                  appName,
                                  deploymentName: activeDeployment,
                                  label,
                                },
                              });
                            } catch (e) {
                              console.error('Rollback failed', e);
                            }
                          }}
                        >
                          <Undo2 className="mr-1 h-3.5 w-3.5" />
                          Rollback
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setHotFixDialog({
                              deploymentName: activeDeployment ?? '',
                              description: `Hot fix: ${label}`,
                            })
                          }
                        >
                          <Flame className="mr-1 h-3.5 w-3.5" />
                          Hot Fix
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

      </Tabs>

      {/* ── Promote Dialog ── */}
      <Dialog
        open={promoteDialog !== null}
        onOpenChange={(open) => {
          if (!open) setPromoteDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote Release</DialogTitle>
            <DialogDescription>
              Promote the latest {promoteDialog?.from} release to {promoteDialog?.to}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPromoteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  await promoteRelease({
                    variables: {
                      input: {
                        serverId,
                        appName,
                        sourceDeploymentName: promoteDialog?.from,
                        destDeploymentName: promoteDialog?.to,
                      },
                    },
                  });
                  setPromoteDialog(null);
                } catch (e) {
                  console.error('Promote failed', e);
                }
              }}
            >
              <Upload className="mr-1 h-4 w-4" />
              Promote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Hot Fix Dialog ── */}
      <Dialog
        open={hotFixDialog !== null}
        onOpenChange={(open) => {
          if (!open) setHotFixDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🔥 Trigger Hot Fix</DialogTitle>
            <DialogDescription>
              This will trigger a GitHub Actions workflow to rebuild and release via CI/CD.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <input
              type="text"
              value={hotFixDialog?.description ?? ''}
              onChange={(e) =>
                setHotFixDialog((prev) =>
                  prev ? { ...prev, description: e.target.value } : null,
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-dark-600 dark:bg-dark-800 dark:text-gray-200"
              placeholder="e.g., Critical bug fix for login crash"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setHotFixDialog(null)}
              disabled={hotFixLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={hotFixLoading}
              onClick={async () => {
                if (!hotFixDialog) return;
                setHotFixLoading(true);
                try {
                  await triggerHotFix({
                    variables: {
                      serverId,
                      appName,
                      deploymentName: hotFixDialog.deploymentName,
                      description: hotFixDialog.description,
                    },
                  });
                  setHotFixDialog(null);
                } catch (e) {
                  console.error('Hot fix trigger failed', e);
                } finally {
                  setHotFixLoading(false);
                }
              }}
            >
              {hotFixLoading ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Flame className="mr-1 h-4 w-4" />
              )}
              {hotFixLoading ? 'Triggering...' : 'Trigger Hot Fix'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
