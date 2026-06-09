// ==========================================
// HyperPush — CodePush Management Page
// ==========================================

import { useMutation, useQuery } from '@apollo/client/react';
import { Button, Card, CardHeader } from '@app/components/ui';
import { CREATE_CODEPUSH_APP, GET_SERVERS } from '@app/lib/graphql';
import type { ServersResponseData } from '@app/types/graphql';
import type { Server as ServerModel } from '@app/types/models';
import { useNavigate } from '@tanstack/react-router';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Server,
  Smartphone,
  Terminal,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const OS_OPTIONS = ['iOS', 'Android'] as const;
const PLATFORM_OPTIONS = [
  'React-Native',
  'Cordova',
  'Unity',
  'Flutter',
  'Xamarin',
  'Other',
] as const;

/** Inline code block helper */
function CodeBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-700 dark:bg-dark-800 dark:text-gray-300">
        <Terminal className="mr-1 inline-block h-3 w-3 text-gray-400" />
        {command}
      </code>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(command);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="shrink-0 rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-dark-700"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

export function CodePushPage() {
  const navigate = useNavigate();
  const [showGuide, setShowGuide] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createServerId, setCreateServerId] = useState('');
  const [createAppName, setCreateAppName] = useState('');
  const [createOs, setCreateOs] = useState('iOS');
  const [createPlatform, setCreatePlatform] = useState('React Native');
  const [createError, setCreateError] = useState('');

  const { data, loading, error } = useQuery(GET_SERVERS);
  const [createCodepushApp, { loading: creatingApp }] = useMutation(CREATE_CODEPUSH_APP, {
    onCompleted: () => {
      setShowCreateDialog(false);
      setCreateAppName('');
      setCreateOs('iOS');
      setCreatePlatform('React Native');
      setCreateError('');
    },
    onError: (err) => {
      setCreateError(err.message);
    },
  });

  const servers: ServerModel[] = (data as ServersResponseData | undefined)?.getServers ?? [];

  const handleCreateApp = async () => {
    if (!createAppName.trim() || !createServerId) return;
    setCreateError('');
    await createCodepushApp({
      variables: {
        input: {
          serverId: createServerId,
          name: createAppName.trim(),
          os: createOs,
          platform: createPlatform,
        },
      },
    });
  };

  const openCreateDialog = () => {
    if (servers.length === 1) {
      setCreateServerId(servers[0].id);
    }
    setCreateAppName('');
    setCreateOs('iOS');
    setCreatePlatform('React Native');
    setCreateError('');
    setShowCreateDialog(true);
  };

  return (
    <div className="space-y-6">
      <CardHeader
        title="CodePush Apps"
        description="Manage CodePush apps, deployments, and releases"
        action={
          <Button
            variant="primary"
            size="sm"
            disabled={servers.length === 0}
            onClick={openCreateDialog}
          >
            <Plus className="mr-1 h-4 w-4" />
            Create App
          </Button>
        }
      />

      {/* ── CodePush Usage Guide ── */}
      <Card padding="lg" className="border border-primary-200 dark:border-primary-800">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              📖 CodePush Usage Guide
            </span>
          </div>
          {showGuide ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {showGuide && (
          <div className="mt-4 space-y-4 border-t border-gray-200 pt-4 text-sm text-gray-600 dark:border-dark-700 dark:text-gray-400">
            {/* 1. Deployment Key */}
            <div>
              <h4 className="mb-1 font-medium text-gray-900 dark:text-gray-100">
                1️⃣ Get Deployment Key
              </h4>
              <p>
                Click a server card to open App Details → <strong>Deployments</strong> tab, copy the key from
                <code className="mx-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-dark-800">
                  Staging
                </code>
                or
                <code className="mx-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-dark-800">
                  Production
                </code>
                . In your React Native project, configure it in
                <code className="mx-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-dark-800">
                  Info.plist
                </code>
                or
                <code className="mx-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-dark-800">
                  build.gradle
                </code>
                .
              </p>
            </div>

            {/* 2. CLI Login */}
            <div>
              <h4 className="mb-1 font-medium text-gray-900 dark:text-gray-100">
                2️⃣ Install CLI & Login
              </h4>
              <div className="space-y-1">
                <CodeBlock command="npm install -g code-push-standalone" />
                <CodeBlock command="code-push-standalone login https://cp.hyperpush.org --accessKey YOUR_ACCESS_KEY" />
              </div>
              <p className="mt-1">
                Access Keys can be created on the server detail page under <strong>CodePush Access Keys</strong>.
                Click <strong>"Create Key"</strong> to generate one, then paste it into the terminal.
              </p>
            </div>

            {/* 3. Release */}
            <div>
              <h4 className="mb-1 font-medium text-gray-900 dark:text-gray-100">
                3️⃣ Publish a Hot Update
              </h4>
              <div className="space-y-1">
                <CodeBlock command='code-push-standalone release-react Tarsier-iOS ios --deploymentName Staging --description "Fixed login crash"' />
                <CodeBlock command='code-push-standalone release-react Tarsier-android android --deploymentName Staging --description "Fixed login crash"' />
              </div>
              <p className="mt-1">
                Or use the <strong>"🔥 Hot Fix"</strong> button (in App Details page) to
                automatically trigger GitHub Actions: pull code → build → publish, no manual steps needed.
              </p>
            </div>

            {/* 4. Promote & Rollback */}
            <div>
              <h4 className="mb-1 font-medium text-gray-900 dark:text-gray-100">
                4️⃣ Promote & Rollback
              </h4>
              <p>
                <strong>Promote</strong>: In the Releases tab, select a Staging version and click
                <strong>"Promote to Production"</strong> to push it to Production.
              </p>
              <p className="mt-1">
                <strong>Rollback</strong>: Click the <strong>"Rollback"</strong> button to
                revert to the previous version. You can also specify a Label to rollback to a specific version.
              </p>
            </div>

            {/* 5. CI/CD Hot Fix */}
            <div>
              <h4 className="mb-1 font-medium text-gray-900 dark:text-gray-100">
                5️⃣ CI/CD Hot Fix (One-Click Publish)
              </h4>
              <p>
                In the App Details page's Releases list, click the <strong>"🔥 Hot Fix"</strong> button.
                The system will automatically complete via GitHub Actions:
              </p>
              <ol className="ml-5 mt-1 list-decimal space-y-0.5">
                <li>Pull latest code</li>
                <li>Run code-push-standalone release-react</li>
                <li>Publish to the target Deployment (Staging / Production)</li>
              </ol>
            </div>
          </div>
        )}
      </Card>

      {/* Create App Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create CodePush App</DialogTitle>
            <DialogDescription>Create a new app on the selected CodePush server.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Server Selection */}
            <div>
              <label
                htmlFor="create-app-server"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Server
              </label>
              <Select value={createServerId} onValueChange={(val) => setCreateServerId(val ?? '')}>
                <SelectTrigger id="create-app-server">
                  <SelectValue placeholder="Select a server" />
                </SelectTrigger>
                <SelectContent>
                  {servers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* App Name */}
            <div>
              <label
                htmlFor="create-app-name"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                App Name
              </label>
              <input
                id="create-app-name"
                placeholder="e.g. MyApp"
                value={createAppName}
                onChange={(e) => setCreateAppName(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
              />
            </div>

            {/* OS Selection */}
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                OS
              </span>
              <div className="flex gap-2">
                {OS_OPTIONS.map((os) => (
                  <button
                    key={os}
                    type="button"
                    onClick={() => setCreateOs(os)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      createOs === os
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-dark-800'
                    }`}
                  >
                    {os}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Selection */}
            <div>
              <label
                htmlFor="create-app-platform"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Platform
              </label>
              <Select value={createPlatform} onValueChange={(val) => setCreatePlatform(val ?? '')}>
                <SelectTrigger id="create-app-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {createError && <p className="text-sm text-red-500">{createError}</p>}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={creatingApp}
              disabled={!createServerId || !createAppName.trim()}
              onClick={handleCreateApp}
            >
              Create App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <Card padding="lg">
          <div className="flex items-center justify-center py-8">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        </Card>
      ) : error ? (
        <Card padding="lg">
          <p className="text-center text-red-500">Failed to load servers: {error.message}</p>
        </Card>
      ) : servers.length === 0 ? (
        <Card padding="lg">
          <div className="py-12 text-center">
            <Server className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-gray-400 dark:text-gray-500">No CodePush servers connected</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Add a server first in the Servers page.
            </p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => navigate({ to: '/dashboard/servers' })}
            >
              Go to Servers
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <Card
              key={server.id}
              padding="lg"
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                navigate({ to: '/dashboard/codepush/$appId', params: { appId: server.id } })
              }
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/20">
                  <Server className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {server.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {server.username}
                  </p>
                </div>
                <Badge variant={server.isOnline ? 'default' : 'secondary'}>
                  {server.isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate({ to: '/dashboard/codepush/$appId', params: { appId: server.id } });
                }}
                className="mt-4 w-full rounded-lg border border-gray-200 p-3 text-center text-sm text-gray-600 hover:bg-gray-50 dark:border-dark-700 dark:text-gray-400 dark:hover:bg-dark-800"
              >
                <Smartphone className="mr-1 inline-block h-4 w-4" />
                View Apps
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
