// ==========================================
// HyperPush — Server Detail Page
// Shows username + connection status + Reset Token
// ==========================================

import { useMutation, useQuery } from '@apollo/client/react';
import { Button } from '@app/components/ui/Button';
import { Card } from '@app/components/ui/Card';
import {
  CODEPUSH_ACCESS_KEYS,
  CREATE_CODEPUSH_ACCESS_KEY,
  DELETE_CODEPUSH_ACCESS_KEY,
  DELETE_SERVER,
  GET_SERVER,
  UPDATE_SERVER,
} from '@app/lib/graphql';
import type { Server as ServerModel } from '@app/types/models';
import { useNavigate, useParams } from '@tanstack/react-router';
import {
  Activity,
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Edit3,
  KeyRound,
  Plus,
  RotateCcw,
  Server,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ServerDetailPage() {
  const navigate = useNavigate();
  const params = useParams({ from: '/dashboard/servers/$id' });
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showResetTokenDialog, setShowResetTokenDialog] = useState(false);
  const [resetPassword, setResetPassword] = useState('');

  const { data, loading, error } = useQuery(GET_SERVER, {
    variables: { id: params.id },
  });

  const [updateServer] = useMutation(UPDATE_SERVER, {
    refetchQueries: [{ query: GET_SERVER, variables: { id: params.id } }],
  });

  const [deleteServer] = useMutation(DELETE_SERVER);

  const server: ServerModel | undefined = (data as { server?: ServerModel } | undefined)
    ?.server;

  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
  });

  // Sync editForm when data loads
  if (server && !isEditing && editForm.name === '') {
    setEditForm({
      name: server.name,
      username: server.username,
    });
  }

  const handleSave = async () => {
    if (!server) return;
    try {
      await updateServer({
        variables: {
          input: {
            id: server.id,
            name: editForm.name,
            username: editForm.username,
          },
        },
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update server:', err);
    }
  };

  const handleDelete = async () => {
    if (!server) return;
    try {
      await deleteServer({ variables: { id: server.id } });
      setShowDeleteDialog(false);
      navigate({ to: '/dashboard/servers' });
    } catch (err) {
      console.error('Failed to delete server:', err);
    }
  };

  const handleResetToken = async () => {
    if (!server) return;
    try {
      await updateServer({
        variables: {
          input: {
            id: server.id,
            password: resetPassword,
          },
        },
      });
      setShowResetTokenDialog(false);
      setResetPassword('');
    } catch (err) {
      console.error('Failed to reset token:', err);
    }
  };

  // ─── Access Keys ─────────────────────────────

  const { data: accessKeysData, loading: keysLoading } = useQuery(CODEPUSH_ACCESS_KEYS, {
    variables: { serverId: params.id },
  });

  const [createAccessKeyMut] = useMutation(CREATE_CODEPUSH_ACCESS_KEY, {
    refetchQueries: [{ query: CODEPUSH_ACCESS_KEYS, variables: { serverId: params.id } }],
  });
  const [deleteAccessKeyMut] = useMutation(DELETE_CODEPUSH_ACCESS_KEY, {
    refetchQueries: [{ query: CODEPUSH_ACCESS_KEYS, variables: { serverId: params.id } }],
  });
  const [creatingKey, setCreatingKey] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  const accessKeys = (
    Array.isArray((accessKeysData as Record<string, unknown>)?.codepushAccessKeys)
      ? (accessKeysData as Record<string, unknown>).codepushAccessKeys
      : []
  ) as Record<string, unknown>[];

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate({ to: '/dashboard/servers' })}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Servers
        </button>
        <Card padding="lg">
          <p className="text-center text-red-500">
            {error ? `Failed to load server: ${error.message}` : 'Server not found'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate({ to: '/dashboard/servers' })}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Servers
      </button>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Server className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{server.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Server ID: {params.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setIsEditing(!isEditing)}>
            <Edit3 className="mr-1 h-4 w-4" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Server</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{server.name}"? This will also remove all
                  associated CodePush apps and data. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Server Info Card */}
      <Card padding="lg">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-4 dark:border-dark-700">
          <Activity className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Server Information
          </h2>
          <Badge variant={server.isOnline ? 'default' : 'secondary'} className="ml-2">
            <span
              className={`mr-1 inline-block h-2 w-2 rounded-full ${
                server.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            {server.isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        <div className="mt-6 space-y-4">
          {/* Name */}
          <div className="grid gap-1">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              <Server className="mr-1 inline-block h-4 w-4" />
              Name
            </span>
            {isEditing ? (
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">{server.name}</p>
            )}
          </div>

          {/* Username */}
          <div className="grid gap-1">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              <User className="mr-1 inline-block h-4 w-4" />
              CodePush Username
            </span>
            {isEditing ? (
              <input
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">{server.username}</p>
            )}
          </div>

          {/* API Key (read-only) with Reset Token button */}
          <div className="grid gap-1">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              <KeyRound className="mr-1 inline-block h-4 w-4" />
              Access Token
            </span>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-gray-100 px-2 py-1 text-sm text-gray-700 break-all dark:bg-dark-800 dark:text-gray-300">
                {server.apiKey}
              </code>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(server.apiKey ?? '');
                  setCopiedToken(true);
                  setTimeout(() => setCopiedToken(false), 2000);
                }}
                className="shrink-0 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-dark-700"
                title="Copy token"
              >
                {copiedToken ? 'Copied!' : 'Copy'}
              </button>

              <Dialog open={showResetTokenDialog} onOpenChange={setShowResetTokenDialog}>
                <Button variant="secondary" size="sm" onClick={() => setShowResetTokenDialog(true)}>
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Reset Token
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Access Token</DialogTitle>
                    <DialogDescription>
                      Enter the CodePush server password to generate a new access token. The current
                      token will be replaced.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-2">
                    <label
                      htmlFor="reset-password"
                      className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      CodePush Password
                    </label>
                    <input
                      id="reset-password"
                      type="password"
                      placeholder="Enter your CodePush password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Used once to obtain a new token. Not stored.
                    </p>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowResetTokenDialog(false);
                        setResetPassword('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      disabled={!resetPassword.trim()}
                      onClick={handleResetToken}
                    >
                      Reset Token
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-1">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              <Calendar className="mr-1 inline-block h-4 w-4" />
              Created
            </span>
            <p className="text-gray-900 dark:text-gray-100">{formatDate(server.createdAt)}</p>
          </div>

          <div className="grid gap-1">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              <Calendar className="mr-1 inline-block h-4 w-4" />
              Last Updated
            </span>
            <p className="text-gray-900 dark:text-gray-100">{formatDate(server.updatedAt)}</p>
          </div>

          {/* Save Button (Edit Mode) */}
          {isEditing && (
            <div className="flex gap-2 pt-2">
              <Button variant="primary" onClick={handleSave}>
                <Check className="mr-1 h-4 w-4" />
                Save Changes
              </Button>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* CodePush Access Keys */}
      <Card padding="lg">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-4 dark:border-dark-700">
          <KeyRound className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            CodePush Access Keys
          </h2>
        </div>

        <div className="mt-4">
          {keysLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              {/* Actions Row */}
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  API keys for CLI authentication.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={creatingKey}
                  onClick={async () => {
                    setCreatingKey(true);
                    setNewKey(null);
                    try {
                      const result = await createAccessKeyMut({
                        variables: {
                          input: {
                            serverId: params.id,
                            friendlyName: 'cli-key',
                            ttl: 3650,
                          },
                        },
                      });
                      const keyRaw = (result.data as Record<string, unknown>)?.createCodepushAccessKey;
                      let keyValue = '';
                      if (typeof keyRaw === 'string') {
                        keyValue = keyRaw;
                      } else if (keyRaw && typeof keyRaw === 'object') {
                        const extractKey = (obj: unknown): string => {
                          if (typeof obj === 'string') return obj;
                          if (obj && typeof obj === 'object') {
                            const o = obj as Record<string, unknown>;
                            if (typeof o.name === 'string') return o.name;
                            if (typeof o.key === 'string') return o.key;
                            if (typeof o.accessKey === 'string') return o.accessKey;
                            if (typeof o.accessKeyToken === 'string') return o.accessKeyToken;
                            if (o.accessKey && typeof o.accessKey === 'object') return extractKey(o.accessKey);
                            if (o.results && typeof o.results === 'object') return extractKey(o.results);
                          }
                          return '';
                        };
                        keyValue = extractKey(keyRaw);
                        if (!keyValue) keyValue = JSON.stringify(keyRaw);
                      }
                      setNewKey(keyValue);
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Failed to create access key');
                    } finally {
                      setCreatingKey(false);
                    }
                  }}
                >
                  {creatingKey ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-1 h-4 w-4" />
                      Create Key
                    </>
                  )}
                </Button>
              </div>

              {/* New Key Display */}
              {newKey && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                  <p className="mb-1 text-sm font-medium text-green-700 dark:text-green-300">
                    Access Key Created!
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 break-all rounded bg-white px-2 py-1 text-xs dark:bg-dark-800">
                      {newKey}
                    </code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(newKey)}
                      className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-dark-700"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                    Save this key — you won't be able to see it again!
                  </p>
                </div>
              )}

              {/* Access Keys List */}
              {accessKeys.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">No access keys yet.</p>
              ) : (
                <div className="space-y-4">
                  {accessKeys.map((key: Record<string, unknown>, idx: number) => {
                    const keyName = String(key.friendlyName ?? key.name ?? '');
                    const isDeleting = deletingKey === keyName;
                    return (
                      <div
                        key={keyName || String(idx)}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-dark-700"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {keyName}
                            </span>
                            {!!key.keyType && (
                              <Badge variant="default" className="text-xs">
                                {String(key.keyType)}
                              </Badge>
                            )}
                          </div>
                          <code className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                            {String(key.key ?? '')}
                          </code>
                          {!!key.createdAt && (
                            <p className="mt-1 text-xs text-gray-400">
                              Created {new Date(String(key.createdAt)).toLocaleDateString()}
                              {!!key.expiresAt &&
                                ` · Expires ${new Date(String(key.expiresAt)).toLocaleDateString()}`}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={async () => {
                            setDeletingKey(keyName);
                            try {
                              await deleteAccessKeyMut({
                                variables: { serverId: params.id, name: keyName },
                              });
                            } catch (err) {
                              alert(
                                err instanceof Error ? err.message : 'Failed to delete access key',
                              );
                            } finally {
                              setDeletingKey(null);
                            }
                          }}
                          className="ml-3 shrink-0 rounded p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                          title={`Delete key "${keyName}"`}
                        >
                          {isDeleting ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
