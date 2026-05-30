// ==========================================
// HyperPush — API Keys Management Page
// ==========================================

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Card, CardHeader, Button } from '@app/components/ui';
import { Plus, Copy, Check, Eye, EyeOff, Trash2 } from 'lucide-react';
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
import { GET_API_KEYS, CREATE_API_KEY, DELETE_API_KEY } from '@app/lib/graphql';
import type { ApiKey } from '@app/types/models';
import type { ApiKeysResponseData } from '@app/types/graphql';

export function ApiKeysPage() {
  const [open, setOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data, loading, error } = useQuery(GET_API_KEYS);
  const [createApiKey] = useMutation(CREATE_API_KEY, {
    refetchQueries: [{ query: GET_API_KEYS }],
  });
  const [deleteApiKey] = useMutation(DELETE_API_KEY, {
    refetchQueries: [{ query: GET_API_KEYS }],
  });

  const apiKeys: ApiKey[] = (data as ApiKeysResponseData | undefined)?.getApiKeys ?? [];

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    try {
      await createApiKey({
        variables: { input: { name: newKeyName } },
      });
      setOpen(false);
      setNewKeyName('');
    } catch (err) {
      console.error('Failed to create API key:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApiKey({ variables: { id } });
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete API key:', err);
    }
  };

  const handleCopyKey = async (id: string, key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = key;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const toggleRevealKey = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <CardHeader
        title="API Keys"
        description="Manage API access keys"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Create Key
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>
                  Create a new API key for programmatic access.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <label
                  htmlFor="new-key-name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Key Name
                </label>
                <input
                  id="new-key-name"
                  placeholder="e.g. CI/CD Pipeline"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
                />
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleCreate}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-red-500">Failed to load API keys: {error.message}</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 dark:text-gray-500">No API keys yet</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Create one to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-dark-700">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {apiKey.name}
                    </span>
                    <Badge
                      variant={apiKey.active ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {apiKey.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-dark-800 dark:text-gray-400">
                      {revealedKeys.has(apiKey.id)
                        ? apiKey.key
                        : `${apiKey.key.slice(0, 12)}...`}
                    </code>
                    <button
                      type="button"
                      onClick={() => toggleRevealKey(apiKey.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title={revealedKeys.has(apiKey.id) ? 'Hide' : 'Show'}
                    >
                      {revealedKeys.has(apiKey.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyKey(apiKey.id, apiKey.key)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Copy"
                    >
                      {copiedId === apiKey.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Created {new Date(apiKey.createdAt).toLocaleDateString()}
                    {apiKey.lastUsed &&
                      ` · Last used ${new Date(apiKey.lastUsed).toLocaleDateString()}`}
                  </p>
                </div>

                {/* Delete */}
                <Dialog
                  open={deleteConfirmId === apiKey.id}
                  onOpenChange={(open) => {
                    if (!open) setDeleteConfirmId(null);
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(apiKey.id)}
                    className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    title="Revoke key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Revoke API Key</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to revoke "{apiKey.name}"?
                        This action cannot be undone. Any services using this
                        key will lose access.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
                        Cancel
                      </Button>
                      <Button variant="danger" onClick={() => handleDelete(apiKey.id)}>
                        Revoke
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
