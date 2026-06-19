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
  CLEAR_CODEPUSH_HISTORY,
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
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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

// ─── Constants ───────────────────────────────

const INITIAL_SHOW_COUNT = 15;
const COMPACT_THRESHOLD = 5;

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
  const [clearHistoryDialog, setClearHistoryDialog] = useState<string | null>(null);
  const [clearHistoryLoading, setClearHistoryLoading] = useState(false);
  const [uploadDialog, setUploadDialog] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAppVersion, setUploadAppVersion] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadIsMandatory, setUploadIsMandatory] = useState(false);
  const [uploadRollout, setUploadRollout] = useState(100);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ── Release list state ──
  const [showAllReleases, setShowAllReleases] = useState(false);

  // ── Queries ──
  const { data: deploymentsData, loading: deploysLoading } = useQuery(CODEPUSH_DEPLOYMENTS, {
    variables: { serverId, appName },
  });

  const deployments = (
    Array.isArray((deploymentsData as Record<string, unknown>)?.codepushDeployments)
      ? (deploymentsData as Record<string, unknown>).codepushDeployments
      : []
  ) as Record<string, unknown>[];

  const {
    data: releasesData,
    loading: releasesLoading,
    refetch: refetchReleases,
  } = useQuery(CODEPUSH_RELEASE_HISTORY, {
    variables: {
      serverId,
      appName,
      deploymentName: activeDeployment ?? '',
    },
    skip: !activeDeployment,
  });

  const releases = (
    Array.isArray((releasesData as Record<string, unknown>)?.codepushReleaseHistory)
      ? (releasesData as Record<string, unknown>).codepushReleaseHistory
      : []
  ) as Record<string, unknown>[];

  // ── Auto-select first deployment when data loads ──
  useEffect(() => {
    if (!activeDeployment && deployments.length > 0) {
      onSetActiveDeployment(String(deployments[0].name ?? ''));
    }
  }, [deployments, activeDeployment, onSetActiveDeployment]);

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
  const [clearHistory] = useMutation(CLEAR_CODEPUSH_HISTORY, {
    refetchQueries: [
      { query: CODEPUSH_RELEASE_HISTORY, variables: { serverId, appName, deploymentName: activeDeployment ?? '' } },
    ],
  });

  // Visible releases: show all or first INITIAL_SHOW_COUNT
  const visibleReleases = showAllReleases ? releases : releases.slice(0, INITIAL_SHOW_COUNT);
  const hiddenCount = releases.length - INITIAL_SHOW_COUNT;

  // ── Upload handler ──
  async function handleUpload() {
    if (!uploadDialog || !uploadFile) return;
    setUploadLoading(true);
    setUploadError(null);
    try {
      const token = localStorage.getItem('hyperpush_token');
      const formData = new FormData();
      formData.append('package', uploadFile);
      formData.append(
        'packageInfo',
        JSON.stringify({
          appVersion: uploadAppVersion,
          description: uploadDescription || undefined,
          isMandatory: uploadIsMandatory,
          rollout: uploadRollout,
        }),
      );
      const res = await fetch(
        `/api/codepush/upload/${serverId}/${appName}/${uploadDialog}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`Upload failed (${res.status}): ${errBody || res.statusText}`);
      }
      setUploadDialog(null);
      setUploadFile(null);
      setUploadAppVersion('');
      setUploadDescription('');
      setUploadIsMandatory(false);
      setUploadRollout(100);
      refetchReleases();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
      console.error('Upload failed', e);
    } finally {
      setUploadLoading(false);
    }
  }

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

        {/* ── Deployments Tab ── */}
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
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setUploadDialog(String(dep.name ?? ''))}
                          >
                            <Upload className="mr-1 h-4 w-4" />
                            Upload Release
                          </Button>
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

        {/* ── Releases Tab ── */}
        <TabsContent value="releases" className="mt-4">
          <Card padding="lg">
            {/* Deployment Filter */}
            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filter:</span>
                {deployments.map((d) => {
                  const name = String(d.name ?? '');
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onSetActiveDeployment(name)}
                      className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                        activeDeployment === name
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-800 dark:text-gray-400 dark:hover:bg-dark-700'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>

              {/* Clear History button — only show when there are releases */}
              {activeDeployment && releases.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => setClearHistoryDialog(activeDeployment)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Clear History
                </Button>
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
              <>
                <div className="space-y-2">
                  {visibleReleases.map((release: Record<string, unknown>, idx: number) => {
                    const label = String(release.label ?? '');
                    const appVersion = String(release.appVersion ?? '');
                    const rollout = Number(release.rollout ?? 100);
                    const size = Number(release.size ?? release.packageSize ?? 0);
                    const isMandatory = Boolean(release.isMandatory);
                    const isDisabled = Boolean(release.isDisabled);
                    const description = release.description ? String(release.description) : null;
                    const releasedBy = String(release.releasedBy ?? '');
                    const createdAt = String(release.createdAt ?? '');
                    const isActive = release.active === true || release.status === 'active';

                    // Compact card for releases beyond the first COMPACT_THRESHOLD
                    if (idx >= COMPACT_THRESHOLD) {
                      return (
                        <div
                          key={label || idx}
                          className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2 text-sm dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-800/50"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="font-mono text-xs font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                              {label}
                            </span>
                            <Badge
                              variant={isActive ? 'default' : 'secondary'}
                              className="text-xs shrink-0"
                            >
                              {isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                App v{appVersion}
                                {createdAt && (
                                  <>
                                    {' '}·{' '}
                                    <span className="whitespace-nowrap">
                                      {new Date(createdAt).toLocaleString()}
                                    </span>
                                  </>
                                )}
                              </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-400">{formatBytes(size)}</span>
                            <button
                              type="button"
                              title={isActive ? 'Rollback to previous version' : 'Rollback to this version'}
                              onClick={async () => {
                                try {
                                  await rollbackRelease({
                                    variables: {
                                      serverId,
                                      appName,
                                      deploymentName: activeDeployment,
                                      // Active release → rollback to previous (no label)
                                      // Inactive release → rollback to this specific version
                                      label: isActive ? undefined : label,
                                    },
                                  });
                                } catch (e) {
                                  const msg = e instanceof Error ? e.message : 'Rollback failed';
                                  console.error('Rollback failed', e);
                                  alert(`Rollback failed: ${msg}`);
                                }
                              }}
                              className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-dark-700"
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Full card for the first COMPACT_THRESHOLD releases
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
                              variant={isActive ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {isActive ? 'Active' : 'Inactive'}
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
                                    // Active release → rollback to previous (no label)
                                    // Inactive release → rollback to this specific version
                                    label: isActive ? undefined : label,
                                  },
                                });
                              } catch (e) {
                                const msg = e instanceof Error ? e.message : 'Rollback failed';
                                console.error('Rollback failed', e);
                                alert(`Rollback failed: ${msg}`);
                              }
                            }}
                          >
                            <Undo2 className="mr-1 h-3.5 w-3.5" />
                            {isActive ? 'Rollback to Previous' : 'Rollback to This Version'}
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

                {/* Show older / Show less toggle */}
                {hiddenCount > 0 && (
                  <div className="mt-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllReleases(!showAllReleases)}
                      className="text-xs text-gray-500"
                    >
                      {showAllReleases ? (
                        <>
                          <ChevronUp className="mr-1 h-3.5 w-3.5" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="mr-1 h-3.5 w-3.5" />
                          Show {hiddenCount} older release{hiddenCount > 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
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

      {/* ── Clear History Dialog ── */}
      <Dialog
        open={clearHistoryDialog !== null}
        onOpenChange={(open) => {
          if (!open) setClearHistoryDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚠️ Clear Release History</DialogTitle>
            <DialogDescription>
              This will permanently delete all release history for{' '}
              <strong>{clearHistoryDialog}</strong>. Only the current active release
              will be preserved. This action <strong>cannot be undone</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setClearHistoryDialog(null)}
              disabled={clearHistoryLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={clearHistoryLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (!clearHistoryDialog) return;
                setClearHistoryLoading(true);
                try {
                  await clearHistory({
                    variables: {
                      serverId,
                      appName,
                      deploymentName: clearHistoryDialog,
                    },
                  });
                  setClearHistoryDialog(null);
                } catch (e) {
                  console.error('Clear history failed', e);
                } finally {
                  setClearHistoryLoading(false);
                }
              }}
            >
              {clearHistoryLoading ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-1 h-4 w-4" />
              )}
              {clearHistoryLoading ? 'Clearing...' : 'Delete All History'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Upload Release Dialog ── */}
      <Dialog
        open={uploadDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setUploadDialog(null);
            setUploadError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload CodePush Release</DialogTitle>
            <DialogDescription>
              Upload a new bundle to <strong>{uploadDialog}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Target Deployment */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Deployment
              </label>
              <select
                value={uploadDialog ?? ''}
                onChange={(e) => setUploadDialog(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-dark-600 dark:bg-dark-800 dark:text-gray-200"
              >
                {deployments.map((d) => (
                  <option key={String(d.name ?? '')} value={String(d.name ?? '')}>
                    {String(d.name ?? '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Bundle File */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bundle File (.zip)
              </label>
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-700 dark:border-dark-600 dark:bg-dark-800 dark:text-gray-200 dark:file:bg-primary-900/20 dark:file:text-primary-400"
              />
              {uploadFile && (
                <p className="mt-1 text-xs text-gray-500">
                  {uploadFile.name} ({formatBytes(uploadFile.size)})
                </p>
              )}
            </div>

            {/* App Version */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                App Version
              </label>
              <input
                type="text"
                value={uploadAppVersion}
                onChange={(e) => setUploadAppVersion(e.target.value)}
                placeholder="e.g. 1.0.0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-dark-600 dark:bg-dark-800 dark:text-gray-200"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Optional release notes"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-dark-600 dark:bg-dark-800 dark:text-gray-200"
              />
            </div>

            {/* Mandatory Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Mandatory Update
              </label>
              <button
                type="button"
                onClick={() => setUploadIsMandatory(!uploadIsMandatory)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  uploadIsMandatory ? 'bg-primary-600' : 'bg-gray-300 dark:bg-dark-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    uploadIsMandatory ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Rollout Slider */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rollout: {uploadRollout}%
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={uploadRollout}
                onChange={(e) => setUploadRollout(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>1%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Error message */}
            {uploadError && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {uploadError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setUploadDialog(null);
                setUploadError(null);
              }}
              disabled={uploadLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={uploadLoading || !uploadFile || !uploadAppVersion.trim()}
              onClick={handleUpload}
            >
              {uploadLoading ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-1 h-4 w-4" />
              )}
              {uploadLoading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
