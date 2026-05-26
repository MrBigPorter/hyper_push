// ==========================================
// HyperPush — Settings Page
// Profile + API Keys sections
// ==========================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAppSelector } from '@app/hooks';
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

interface ProfileFormData {
  name: string;
  email: string;
}

// Mock API keys for display
interface SettingsApiKey {
  id: string;
  name: string;
  key: string;
  active: boolean;
  createdAt: string;
  lastUsed: string | null;
}

const mockApiKeys: SettingsApiKey[] = [
  {
    id: '1',
    name: 'Development',
    key: 'hp_dev_abc123def456...',
    active: true,
    createdAt: '2025-01-15T00:00:00Z',
    lastUsed: '2025-05-25T10:30:00Z',
  },
  {
    id: '2',
    name: 'Production',
    key: 'hp_prod_xyz789...',
    active: true,
    createdAt: '2025-02-01T00:00:00Z',
    lastUsed: '2025-05-26T08:00:00Z',
  },
];

export function SettingsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [profileSaved, setProfileSaved] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
    // TODO: Replace with actual updateProfile mutation
    console.log('Profile update:', data);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleCopyKey = async (id: string, key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteKey = (id: string) => {
    // TODO: Replace with actual revokeAccessKey mutation
    console.log('Delete API key:', id);
    setDeleteConfirmId(null);
  };

  // ─── Render ──────────────────────────────

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

      {/* ─── Profile Section ─────────────── */}
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

        <form
          onSubmit={handleSubmit(onProfileSubmit)}
          className="mt-6 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
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

            {/* Email */}
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

          {/* Role Display */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role
            </label>
            <Badge variant="secondary">
              {user?.role ?? 'developer'}
            </Badge>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" variant="primary" disabled={profileSaved}>
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

      {/* ─── API Keys Section ────────────── */}
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
            <DialogTrigger>
              <Button variant="primary" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                New Key
              </Button>
            </DialogTrigger>
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
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
                />
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setShowNewKeyDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    // TODO: Replace with actual createApiKey mutation
                    setShowNewKeyDialog(false);
                  }}
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* API Keys List */}
        <div className="mt-4 space-y-3">
          {mockApiKeys.map((apiKey) => (
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
                  Created{' '}
                  {new Date(apiKey.createdAt).toLocaleDateString()}
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
                <DialogTrigger>
                  <button
                    type="button"
                    className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    title="Revoke key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </DialogTrigger>
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
                    <Button
                      variant="ghost"
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteKey(apiKey.id)}
                    >
                      Revoke
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ))}

          {mockApiKeys.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">
              No API keys yet. Create one to get started.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
