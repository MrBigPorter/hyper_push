// ==========================================
// HyperPush — Servers Management Page
// Create Server with username/password auth
// ==========================================

import { useMutation, useQuery } from '@apollo/client/react';
import { Button, Card, CardHeader } from '@app/components/ui';
import { CREATE_SERVER, DELETE_SERVER, GET_SERVERS } from '@app/lib/graphql';
import type { ServersResponseData } from '@app/types/graphql';
import type { Server as ServerModel } from '@app/types/models';
import { useNavigate } from '@tanstack/react-router';
import { KeyRound, Plus, Server, User } from 'lucide-react';
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

interface CreateServerForm {
  name: string;
  username: string;
  password: string;
}

export function ServersPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateServerForm>({
    name: '',
    username: '',
    password: '',
  });

  const { data, loading, error } = useQuery(GET_SERVERS);
  const [createServer, { loading: creating }] = useMutation(CREATE_SERVER, {
    refetchQueries: [{ query: GET_SERVERS }],
  });
  const [deleteServer] = useMutation(DELETE_SERVER, {
    refetchQueries: [{ query: GET_SERVERS }],
  });

  const servers: ServerModel[] = (data as ServersResponseData | undefined)?.getServers ?? [];

  const handleSubmit = async () => {
    try {
      await createServer({
        variables: {
          input: {
            name: form.name,
            username: form.username,
            password: form.password,
          },
        },
      });
      setOpen(false);
      setForm({ name: '', username: '', password: '' });
    } catch (err) {
      console.error('Failed to create server:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteServer({ variables: { id } });
    } catch (err) {
      console.error('Failed to delete server:', err);
    }
  };

  const updateField = (field: keyof CreateServerForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = form.name.trim() && form.username.trim() && form.password.trim();

  return (
    <div className="space-y-6">
      <CardHeader
        title="Servers"
        description="Manage CodePush backend server connections"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Server
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add CodePush Server</DialogTitle>
                <DialogDescription>
                  Enter the server details and your CodePush login credentials. The password is used
                  once to obtain an access token and is not stored.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Name */}
                <div>
                  <label
                    htmlFor="server-name"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <Server className="mr-1 inline-block h-4 w-4" />
                    Server Name
                  </label>
                  <input
                    id="server-name"
                    placeholder="e.g. Production Server"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
                  />
                </div>

                {/* Username */}
                <div>
                  <label
                    htmlFor="server-username"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <User className="mr-1 inline-block h-4 w-4" />
                    CodePush Username
                  </label>
                  <input
                    id="server-username"
                    placeholder="admin@example.com"
                    value={form.username}
                    onChange={(e) => updateField('username', e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="server-password"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <KeyRound className="mr-1 inline-block h-4 w-4" />
                    CodePush Password
                  </label>
                  <input
                    id="server-password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Used once to obtain an access token. Not stored.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOpen(false);
                    setForm({ name: '', username: '', password: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={!isFormValid || creating}
                  loading={creating}
                  onClick={handleSubmit}
                >
                  Add Server
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
            <p className="text-red-500">Failed to load servers: {error.message}</p>
          </div>
        ) : servers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 dark:text-gray-500">No servers yet</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Click "Add Server" to connect your first CodePush server.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-dark-700">
            {servers.map((server) => (
              <button
                key={server.id}
                type="button"
                className="flex w-full items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-dark-800/50 cursor-pointer transition-colors text-left"
                onClick={() =>
                  navigate({ to: '/dashboard/servers/$id', params: { id: server.id } })
                }
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      server.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{server.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{server.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={server.isOnline ? 'default' : 'secondary'}>
                    {server.isOnline ? 'Online' : 'Offline'}
                  </Badge>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(server.id);
                    }}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
