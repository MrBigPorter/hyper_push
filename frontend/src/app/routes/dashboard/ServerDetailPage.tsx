// ==========================================
// HyperPush — Server Detail Page
// Shows username + connection status + Reset Token
// ==========================================

import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import {
  ArrowLeft,
  Server,
  Globe,
  User,
  KeyRound,
  Calendar,
  Activity,
  Edit3,
  Trash2,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import { Card } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Server as ServerModel } from '@app/types/models';

// Mock server detail with username field
const mockServer: ServerModel = {
  id: '1',
  name: 'Production Server',
  baseUrl: 'https://codepush.example.com',
  username: 'admin@example.com',
  apiKey: 'cp_prod_xxxxx...',
  isOnline: true,
  userId: 'user-1',
  createdAt: '2025-01-15T00:00:00Z',
  updatedAt: '2025-05-26T08:00:00Z',
};

const connectionHistory = [
  { date: '2025-05-26T08:00:00Z', status: 'online', latency: '45ms' },
  { date: '2025-05-26T07:00:00Z', status: 'online', latency: '42ms' },
  { date: '2025-05-26T06:00:00Z', status: 'online', latency: '48ms' },
  { date: '2025-05-26T05:00:00Z', status: 'offline', latency: 'N/A' },
  { date: '2025-05-26T04:00:00Z', status: 'online', latency: '44ms' },
];

export function ServerDetailPage() {
  const navigate = useNavigate();
  const params = useParams({ from: '/dashboard/servers/$id' });
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetTokenDialog, setShowResetTokenDialog] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [editForm, setEditForm] = useState({
    name: mockServer.name,
    baseUrl: mockServer.baseUrl,
    username: mockServer.username,
  });

  const handleSave = () => {
    // TODO: Replace with actual updateServer mutation
    console.log('Update server:', params.id, editForm);
    setIsEditing(false);
  };

  const handleDelete = () => {
    // TODO: Replace with actual deleteServer mutation
    console.log('Delete server:', params.id);
    setShowDeleteDialog(false);
    navigate({ to: '/dashboard/servers' });
  };

  const handleResetToken = () => {
    // TODO: Replace with actual updateServer mutation (password-only)
    console.log('Reset token for server:', params.id, { password: resetPassword });
    setShowResetTokenDialog(false);
    setResetPassword('');
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString();
  };

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {mockServer.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Server ID: {params.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit3 className="mr-1 h-4 w-4" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>

          <Dialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <DialogTrigger>
              <Button variant="danger" size="sm">
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Server</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{mockServer.name}"?
                  This will also remove all associated CodePush apps and
                  data. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteDialog(false)}
                >
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
          <Badge
            variant={mockServer.isOnline ? 'default' : 'secondary'}
            className="ml-2"
          >
            <span
              className={`mr-1 inline-block h-2 w-2 rounded-full ${
                mockServer.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            {mockServer.isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        <div className="mt-6 space-y-4">
          {/* Name */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              <Server className="mr-1 inline-block h-4 w-4" />
              Name
            </label>
            {isEditing ? (
              <input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">
                {mockServer.name}
              </p>
            )}
          </div>

          {/* Base URL */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              <Globe className="mr-1 inline-block h-4 w-4" />
              Base URL
            </label>
            {isEditing ? (
              <input
                value={editForm.baseUrl}
                onChange={(e) =>
                  setEditForm({ ...editForm, baseUrl: e.target.value })
                }
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
              />
            ) : (
              <code className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-700 dark:bg-dark-800 dark:text-gray-300">
                {mockServer.baseUrl}
              </code>
            )}
          </div>

          {/* Username (replaces editable API Key) */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              <User className="mr-1 inline-block h-4 w-4" />
              CodePush Username
            </label>
            {isEditing ? (
              <input
                value={editForm.username}
                onChange={(e) =>
                  setEditForm({ ...editForm, username: e.target.value })
                }
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">
                {mockServer.username}
              </p>
            )}
          </div>

          {/* API Key (read-only) with Reset Token button */}
          <div className="grid gap-1">
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              <KeyRound className="mr-1 inline-block h-4 w-4" />
              Access Token
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-gray-100 px-2 py-1 text-sm text-gray-700 dark:bg-dark-800 dark:text-gray-300">
                {mockServer.apiKey}
              </code>

              {/* Reset Token Button */}
              <Dialog
                open={showResetTokenDialog}
                onOpenChange={setShowResetTokenDialog}
              >
                <DialogTrigger>
                  <Button variant="secondary" size="sm">
                    <RotateCcw className="mr-1 h-4 w-4" />
                    Reset Token
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Access Token</DialogTitle>
                    <DialogDescription>
                      Enter the CodePush server password to generate a new
                      access token. The current token will be replaced.
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
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              <Calendar className="mr-1 inline-block h-4 w-4" />
              Created
            </label>
            <p className="text-gray-900 dark:text-gray-100">
              {formatDate(mockServer.createdAt)}
            </p>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              <Calendar className="mr-1 inline-block h-4 w-4" />
              Last Updated
            </label>
            <p className="text-gray-900 dark:text-gray-100">
              {formatDate(mockServer.updatedAt)}
            </p>
          </div>

          {/* Save Button (Edit Mode) */}
          {isEditing && (
            <div className="flex gap-2 pt-2">
              <Button variant="primary" onClick={handleSave}>
                <Check className="mr-1 h-4 w-4" />
                Save Changes
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsEditing(false)}
              >
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Connection History Card */}
      <Card padding="lg">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-4 dark:border-dark-700">
          <Activity className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Connection History
          </h2>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-700">
                <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">
                  Time
                </th>
                <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="pb-2 font-medium text-gray-500 dark:text-gray-400">
                  Latency
                </th>
              </tr>
            </thead>
            <tbody>
              {connectionHistory.map((entry, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 last:border-0 dark:border-dark-800"
                >
                  <td className="py-2 text-gray-900 dark:text-gray-100">
                    {formatDate(entry.date)}
                  </td>
                  <td className="py-2">
                    <Badge
                      variant={
                        entry.status === 'online'
                          ? 'default'
                          : 'secondary'
                      }
                      className="text-xs"
                    >
                      {entry.status === 'online' ? (
                        <Check className="mr-1 h-3 w-3" />
                      ) : (
                        <X className="mr-1 h-3 w-3" />
                      )}
                      {entry.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-gray-700 dark:text-gray-300">
                    {entry.latency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
