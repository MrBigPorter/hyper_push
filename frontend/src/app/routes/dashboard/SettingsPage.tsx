// ==========================================
// HyperPush — Settings Page
// Profile + API Keys sections
// ==========================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@apollo/client/react';
import { useAppSelector, useAppDispatch } from '@app/hooks';
import { setUser } from '@app/store/slices/authSlice';
import {
  User,
  KeyRound,
  Save,
  Copy,
  Check,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from 'lucide-react';
import { Card } from '@app/components/ui/Card';
import { Input } from '@app/components/ui/Input';
import { Button } from '@app/components/ui/Button';
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
import { GET_API_KEYS, CREATE_API_KEY, DELETE_API_KEY, UPDATE_USER_MUTATION } from '@app/lib/graphql';
import type { ApiKey } from '@app/types/models';
import type { ApiKeysResponseData, UpdateUserResponseData } from '@app/types/graphql';

interface ProfileFormData {
  name: string;
  email: string;
}

export function SettingsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const [profileSaved, setProfileSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data, loading: keysLoading } = useQuery(GET_API_KEYS);
  const [createApiKey] = useMutation(CREATE_API_KEY, {
    refetchQueries: [{ query: GET_API_KEYS }],
  });
  const [deleteApiKey] = useMutation(DELETE_API_KEY, {
    refetchQueries: [{ query: GET_API_KEYS }],
  });
  const [updateUser] = useMutation(UPDATE_USER_MUTATION);

  const apiKeys: ApiKey[] = (data as ApiKeysResponseData | undefined)?.getApiKeys ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const result = await updateUser({
        variables: { input: { id: user.id, name: data.name } },
      });
      const updatedUser = (result.data as UpdateUserResponseData)?.updateUser;
      if (updatedUser) {
        dispatch(setUser(updatedUser));
      }
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
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

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      await createApiKey({
        variables: { input: { name: newKeyName } },
      });
      setShowNewKeyDialog(false);
      setNewKeyName('');
    } catch (err) {
      console.error('Failed to create API key:', err);
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      await deleteApiKey({ variables: { id } });
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete API key:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your profile and API keys
        </p>
      </div>

      {/* Profile Section */}
      <Card padding="lg">
        <div className="flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-dark-700">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/20">
            <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Profile
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your personal information
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onProfileSubmit)} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="profile-name"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Name
              </label>
              <input
                id="profile-name"
                placeholder="Your name"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
                {...register('name')}
              />
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                placeholder="you@example.com"
                disabled
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('email')}
              />
              <p className="mt-1 text-xs text-gray-400">
                Email cannot be changed
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role
            </label>
            <Badge variant="secondary">
              {user?.role ?? 'developer'}
            </Badge>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" variant="primary" disabled={profileSaved || isSaving} loading={isSaving}>
              {profileSaved ? (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="mr-1 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* API Keys Section */}
      <Card padding="lg">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-dark-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
              <KeyRound className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                API Keys
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your personal API access keys
              </p>
            </div>
          </div>

          <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
            <Button variant="primary" size="sm" onClick={() => setShowNewKeyDialog(true)}>
              <Plus className="mr-1 h-4 w-4" />
              New Key
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
                <Button variant="ghost" onClick={() => setShowNewKeyDialog(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleCreateKey}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* API Keys List */}
        <div className="mt-4 space-y-3">
          {keysLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
          ) : apiKeys.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No API keys yet. Create one to get started.
            </p>
          ) : (
            apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-dark-700"
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
                      <Button variant="danger" onClick={() => handleDeleteKey(apiKey.id)}>
                        Revoke
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
