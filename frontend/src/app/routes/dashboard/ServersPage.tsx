// ==========================================
// HyperPush — Servers Management Page
// Create Server with username/password auth
// ==========================================

import { useState } from 'react';
import { Card, CardHeader, Button } from '@app/components/ui';
import { Plus, Server, Globe, User, KeyRound } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CreateServerForm {
  name: string;
  baseUrl: string;
  username: string;
  password: string;
}

export function ServersPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateServerForm>({
    name: '',
    baseUrl: '',
    username: '',
    password: '',
  });

  const handleSubmit = () => {
    // TODO: Replace with actual createServer mutation
    console.log('Create server:', form);
    setOpen(false);
    setForm({ name: '', baseUrl: '', username: '', password: '' });
  };

  const updateField = (field: keyof CreateServerForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    form.name.trim() &&
    form.baseUrl.trim() &&
    form.username.trim() &&
    form.password.trim();

  return (
    <div className="space-y-6">
      <CardHeader
        title="Servers"
        description="Manage CodePush backend server connections"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
              <Button variant="primary" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Add Server
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add CodePush Server</DialogTitle>
                <DialogDescription>
                  Enter the server details and your CodePush login credentials.
                  The password is used once to obtain an access token and is not
                  stored.
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

                {/* Base URL */}
                <div>
                  <label
                    htmlFor="server-baseurl"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <Globe className="mr-1 inline-block h-4 w-4" />
                    Base URL
                  </label>
                  <input
                    id="server-baseurl"
                    placeholder="https://codepush.example.com"
                    value={form.baseUrl}
                    onChange={(e) => updateField('baseUrl', e.target.value)}
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
                    setForm({
                      name: '',
                      baseUrl: '',
                      username: '',
                      password: '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={!isFormValid}
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
        {/*
          TODO: Write your GraphQL servers query here
          Example:
            const { data, loading } = useQuery(GET_SERVERS);
            if (loading) return <LoadingSkeleton />;
            return <ServerTable servers={data.servers} />;

          Server type: import { Server } from '@app/types'
        */}
        <div className="py-16 text-center">
          <p className="text-gray-400 dark:text-gray-500">
            No servers yet
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Click "Add Server" to connect your first CodePush server.
          </p>
        </div>
      </Card>
    </div>
  );
}
