// ==========================================
// HyperPush — Install Guide Page
// How to install, configure & integrate CodePush
// using a self-hosted lisong/code-push-server
// ==========================================

import { BookOpen, CheckCircle, Code2, Copy, Cpu, ExternalLink, FileCode, Package, Plug, Target, Terminal, Wrench } from 'lucide-react';
import { useState } from 'react';

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      <div className="flex items-center justify-between rounded-t-lg bg-gray-800 px-4 py-2 dark:bg-gray-900">
        <span className="text-xs font-medium text-gray-400">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200"
        >
          {copied ? (
            <>
              <CheckCircle className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-b-lg border-x border-b border-gray-300 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-dark-800">
        <code className="text-gray-800 dark:text-gray-200">{code}</code>
      </pre>
    </div>
  );
}

interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

function StepCard({ icon, title, description, children }: StepCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-900">
      <div className="mb-4 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/20">
          <div className="text-primary-600 dark:text-primary-400">{icon}</div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <div className="ml-14">{children}</div>
    </div>
  );
}

function ExternalLinkCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/50 dark:border-dark-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/10"
    >
      <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </a>
  );
}

export function InstallGuidePage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Install Guide</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Step-by-step guide to integrate CodePush SDK into your React Native app using a self-hosted CodePush server
        </p>
      </div>

      {/* Overview */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/50 dark:bg-blue-950/30">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Architecture Overview</h2>
            <p className="mt-2 text-sm text-blue-700 dark:text-blue-400">
              This guide covers integrating <strong>react-native-code-push</strong> with a <strong>self-hosted lisong/code-push-server</strong>,
              managed through HyperPush Console. The server URL and deployment keys are configured natively (iOS Info.plist / Android build.gradle),
              while the JS SDK handles update checking, downloading, and installation automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          In this guide
        </h2>
        <ul className="space-y-2">
          {[
            { href: '#quick-start', label: 'Quick Start (React Native)' },
            { href: '#prerequisites', label: '1. Prerequisites' },
            { href: '#install-sdk', label: '2. Install CodePush SDK' },
            { href: '#configure-native', label: '3. Native Configuration (iOS & Android)' },
            { href: '#integrate', label: '4. Integrate into App' },
            { href: '#deploy-keys', label: '5. Deployment Keys' },
            { href: '#release', label: '6. Release an Update' },
            { href: '#cli-setup', label: '7. CLI & Makefile Setup' },
            { href: '#advanced', label: '8. Advanced Usage' },
            { href: '#troubleshooting', label: 'Troubleshooting' },
          ].map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* ======================================== */}
      {/* Stage Guide: Where are you? */}
      {/* ======================================== */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-900/50 dark:bg-indigo-950/30">
        <div className="flex items-start gap-3">
          <Target className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h2 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">🤔 What's your goal?</h2>
            <p className="mt-2 text-sm text-indigo-700 dark:text-indigo-400">
              Choose the right section based on what you need to do:
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href="#install-sdk"
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-800/50"
              >
                📱 Integrate SDK → Step 2
              </a>
              <a
                href="#release"
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-800/50"
              >
                🚀 Release Update → Step 6
              </a>
              <a
                href="#cli-setup"
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-800/50"
              >
                ⚙️ Makefile Automation → Step 7
              </a>
              <a
                href="#troubleshooting"
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-800/50"
              >
                ❓ Troubleshooting
              </a>
              <a
                href="/dashboard/servers"
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-800/50"
              >
                🔑 Get Access Key → Server Detail
              </a>
              <span className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-indigo-400 shadow-sm dark:bg-indigo-900/50 dark:text-indigo-400">
                🆕 New here? → Create App in CodePush page
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================== */}
      {/* Step 0: Quick Start */}
      {/* ======================================== */}
      <div id="quick-start">
        <StepCard
          icon={<Terminal className="h-5 w-5" />}
          title="Quick Start (React Native)"
          description="Get CodePush running in your app in under 10 minutes"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Integrate the CodePush SDK with your self-hosted server managed through HyperPush Console:
            </p>

            <CodeBlock
              language="bash"
              code="# 1. Install the SDK
npm install react-native-code-push

# 2. Install CocoaPods (iOS)
cd ios && pod install && cd ..

# 3. Configure natively (skip this section for details):
#    iOS:  Info.plist  → CodePushServerURL + CodePushDeploymentKey
#    Android: build.gradle flavors → ServerUrl + CodePushDeploymentKey

# 4. Wrap root component with codePush() HOC (see Step 4)

# 5. Install code-push-standalone CLI (for releasing updates)
npm install -g code-push-standalone

# 6. Login to your self-hosted server
code-push-standalone login https://cp.hyperpush.org/codepush --accessKey 'your-access-key'

# 7. Release your first update
code-push-standalone release-react YOUR_APP_NAME ios --deploymentName Staging"
            />

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-950/30">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>Note:</strong> This guide assumes you have already deployed a <strong>lisong/code-push-server</strong> instance,
                created your apps and deployments, and generated an access key. Use HyperPush Console to manage everything.
              </p>
            </div>
          </div>
        </StepCard>
      </div>

      {/* ======================================== */}
      {/* Step 1: Prerequisites */}
      {/* ======================================== */}
      <div id="prerequisites">
        <StepCard
          icon={<Cpu className="h-5 w-5" />}
          title="1. Prerequisites"
          description="What you need before integrating CodePush"
        >
          <ul className="space-y-3">
            {[
              {
                label: 'A React Native project',
                desc: 'CodePush supports React Native 0.60+ (Android & iOS)',
              },
              {
                label: 'Self-hosted CodePush server deployed',
                desc: 'lisong/code-push-server running on your server, accessible via URL (e.g., https://cp.hyperpush.org/codepush)',
              },
              {
                label: 'HyperPush account & API Key',
                desc: 'Register in HyperPush Console and generate an API Key from the API Keys page',
              },
              {
                label: 'Apps created in HyperPush',
                desc: 'Go to CodePush page → "Create App" (one per platform, e.g., MyApp-ios, MyApp-android)',
              },
              {
                label: 'Access key for code-push-standalone CLI',
                desc: 'Generated from your server via REST API or HyperPush Console, used to authenticate CLI commands',
              },
            ].map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </StepCard>
      </div>

      {/* ======================================== */}
      {/* Step 2: Install SDK */}
      {/* ======================================== */}
      <div id="install-sdk">
        <StepCard
          icon={<Package className="h-5 w-5" />}
          title="2. Install CodePush SDK"
          description="Add react-native-code-push to your project"
        >
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">React Native CLI</h4>
            <CodeBlock
              language="bash"
              code="npm install react-native-code-push

# iOS: Install CocoaPods
cd ios && pod install && cd .."
            />

            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Expo (with dev-client)</h4>
            <CodeBlock
              language="bash"
              code="# Install expo-dev-client first (if not already)
npx expo install expo-dev-client

# Install CodePush
npm install react-native-code-push

# Rebuild the dev client
npx expo run:ios    # or
npx expo run:android"
            />

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-700 dark:bg-dark-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Platform support:</strong> react-native-code-push supports iOS (9.0+) and Android (4.1+ / API 16+).
                React Native 0.60+ uses auto-linking — no manual linking required.
                For React Native 0.76+, the New Architecture is supported as of react-native-code-push 9.x.
              </p>
            </div>
          </div>
        </StepCard>
      </div>

      {/* ======================================== */}
      {/* Step 3: Native Configuration */}
      {/* ======================================== */}
      <div id="configure-native">
        <StepCard
          icon={<FileCode className="h-5 w-5" />}
          title="3. Native Configuration (iOS & Android)"
          description="Configure server URL native keys — no JS config file needed"
        >
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Unlike the Microsoft App Center SDK (which reads server URL and deployment key from JS),
              the <strong>self-hosted lisong/code-push-server</strong> setup requires native configuration.
              The SDK automatically reads these values from platform-specific sources — no JavaScript config file needed.
            </p>

            {/* iOS */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                iOS — Info.plist
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add two keys to your <code>ios/AppName/Info.plist</code>:
              </p>
              <div className="mt-3">
                <CodeBlock
                  language="xml"
                  code={`<key>CodePushServerURL</key>
<string>https://cp.hyperpush.org/codepush</string>
<key>CodePushDeploymentKey</key>
<string>$(CODEPUSH_DEPLOYMENT_KEY)</string>`}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                The <code>CodePushServerURL</code> is read natively by{' '}
                <code>CodePushConfig.m</code> at initialization time.{' '}
                The <code>$(CODEPUSH_DEPLOYMENT_KEY)</code> variable is resolved from your xcconfig build settings
                (see Step 5 for deployment key management).
              </p>
            </div>

            {/* Android */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Android — build.gradle (flavor-specific)
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add <code>resValue</code> entries inside each product flavor in{' '}
                <code>android/app/build.gradle</code>:
              </p>
              <div className="mt-3">
                <CodeBlock
                  language="groovy"
                  code={`staging {
    dimension "env"
    applicationIdSuffix ".test"
    versionNameSuffix "-test"
    resValue "string", "app_name", "MyApp(Test)"
    resValue "string", "CodePushDeploymentKey", "YOUR_STAGING_KEY"
    resValue "string", "ServerUrl", "https://cp.hyperpush.org/codepush"   // ← add this
}
production {
    dimension "env"
    applicationIdSuffix ""
    resValue "string", "app_name", "MyApp"
    resValue "string", "CodePushDeploymentKey", "YOUR_PRODUCTION_KEY"
    resValue "string", "ServerUrl", "https://cp.hyperpush.org/codepush"   // ← add this
}`}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                The <code>ServerUrl</code> string resource is read natively by{' '}
                <code>CodePush.java</code> at initialization. The <code>CodePushDeploymentKey</code> varies per flavor.
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Why native?</strong> The server URL must be available at native runtime, before any JavaScript executes.
                This ensures the SDK can check for updates even if the JS bundle fails to load.
              </p>
            </div>
          </div>
        </StepCard>
      </div>

      {/* ======================================== */}
      {/* Step 4: Integrate */}
      {/* ======================================== */}
      <div id="integrate">
        <StepCard
          icon={<Code2 className="h-5 w-5" />}
          title="4. Integrate into Your App"
          description="Wrap your root component with the CodePush HOC"
        >
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Basic Integration</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Wrap your app's root component with the <code>codePush</code> HOC.
                The server URL and deployment key are already configured natively, so no JS config is needed:
              </p>
              <div className="mt-3">
                <CodeBlock
                  language="jsx"
                  code={`
import React from 'react';
import codePush from 'react-native-code-push';
import codePush from 'react-native-code-push';

function App() {
  return (
    /* Your app content */
  );
}

// ON_APP_RESUME: check for update every time the app returns from background
// ON_NEXT_RESTART: download silently, install on next cold start
const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  installMode: codePush.InstallMode.ON_NEXT_RESTART,
};

export default codePush(codePushOptions)(App);
`}
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Mandatory Updates
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                For critical fixes, use a separate install mode for mandatory updates:
              </p>
              <div className="mt-3">
                <CodeBlock
                  language="jsx"
                  code={`
import codePush from 'react-native-code-push';

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  installMode: codePush.InstallMode.ON_NEXT_RESTART,
  mandatoryInstallMode: codePush.InstallMode.IMMEDIATE,
};

export default codePush(codePushOptions)(App);
`}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                When you release an update with <code>--mandatory</code>, it will be applied immediately
                (app restarts automatically).
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-700 dark:bg-dark-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Tip:</strong> You do <em>not</em> need to call <code>codePush.setServerUrl()</code> in JS.
                The server URL is read natively from Info.plist (iOS) or string resources (Android).
                This is a fundamental difference from using Microsoft App Center.
              </p>
            </div>
          </div>
        </StepCard>
      </div>

      {/* ======================================== */}
      {/* Step 5: Deployment Keys */}
      {/* ======================================== */}
      <div id="deploy-keys">
        <StepCard
          icon={<Plug className="h-5 w-5" />}
          title="5. Deployment Keys"
          description="Where to place Staging and Production deployment keys"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Each App has <strong>Staging</strong> and <strong>Production</strong> deployments by default.
              Copy the keys from <code>code-push-standalone deployment ls {'<'}AppName{'>'} -k</code> into the following locations:
            </p>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-700">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-dark-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-dark-800">
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">App</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Deployment</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Config Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">MyApp-ios</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">Staging</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">ios/Config/Test.xcconfig — CODEPUSH_DEPLOYMENT_KEY</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">MyApp-android</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">Staging</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">android/app/build.gradle — staging flavor CodePushDeploymentKey</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">MyApp-ios</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">Production</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">ios/Config/Prod.xcconfig — CODEPUSH_DEPLOYMENT_KEY</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">MyApp-android</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">Production</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">android/app/build.gradle — production flavor CodePushDeploymentKey</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Additionally, configure these <strong>GitHub Secrets</strong> for CI/CD:
            </p>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-700">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-dark-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-dark-800">
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Secret</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">CODEPUSH_SERVER_URL</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">https://codepush.yourdomain.com</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">CODEPUSH_ACCESS_KEY</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{'(generated from server)'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </StepCard>
      </div>

      {/* ======================================== */}
      {/* Step 6: Release an Update */}
      {/* ======================================== */}
      <div id="release">
        <StepCard
          icon={<Terminal className="h-5 w-5" />}
          title="6. Release an Update"
          description="Push a new JavaScript bundle using code-push-standalone CLI"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use <strong>code-push-standalone</strong> CLI (not Microsoft's deprecated code-push CLI) to release updates.
              First install and login:
            </p>

            <CodeBlock
              language="bash"
              code="# Install the standalone CLI (one-time)
npm install -g code-push-standalone

# Login with your access key
code-push-standalone login https://cp.hyperpush.org/codepush --accessKey 'your-access-key'

# Verify login
code-push-standalone app list

# Logout (when done)
code-push-standalone logout"
            />

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/30">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>🔑 Don't have an Access Key yet?</strong>
                Go to <strong>Servers → Server Detail</strong>, click <strong>"Copy Login Command"</strong> in the
                <strong> One-Click CLI Login</strong> section, or create one manually in <strong>CodePush Access Keys</strong>.
                See the <a href="/docs/codepush-cli.md" className="underline">CodePush CLI Guide</a> for full instructions.
              </p>
            </div>

            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Release Commands
            </h4>
            <CodeBlock
              language="bash"
              code="# Release to Staging (iOS)
code-push-standalone release-react MyApp-ios ios --deploymentName Staging

# Release to Staging (Android)
code-push-standalone release-react MyApp-android android --deploymentName Staging

# Release to Production (with description)
code-push-standalone release-react MyApp-ios ios \
  --deploymentName Production \
  --description 'Critical bug fix: login crash'

# Mandatory update (applied immediately)
code-push-standalone release-react MyApp-ios ios \
  --deploymentName Production \
  --mandatory \
  --description 'Security patch'

# Promote from Staging → Production
code-push-standalone promote MyApp-ios Staging Production

# View release history
code-push-standalone deployment history MyApp-ios Staging

# List all deployment keys
code-push-standalone deployment ls MyApp-ios -k"
            />

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-700 dark:bg-dark-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Tip:</strong> You can also release updates directly from the HyperPush Console UI.
                Go to <strong>CodePush</strong> → select your App → select Deployment → click <strong>"Upload Release"</strong> to upload a .zip bundle.
              </p>
            </div>
          </div>
        </StepCard>
      </div>

      {/* ======================================== */}
      {/* Step 7: CLI & Makefile Setup */}
      {/* ======================================== */}
      <div id="cli-setup">
        <StepCard
          icon={<FileCode className="h-5 w-5" />}
          title="7. CLI & Makefile Setup"
          description="Automate releases with Makefile targets"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add these Makefile targets to standardize releases across your team.
              This pattern is used in production projects with 4 apps (iOS + Android × Staging + Production):
            </p>

            <CodeBlock
              language="makefile"
              code={`# ── CodePush Self-Hosted ─────────────────────
CODEPUSH_STANDALONE_CMD := code-push-standalone
CODEPUSH_SERVER_URL := https://cp.hyperpush.org/codepush

# Login (requires access key)
codepush-login:
	code-push-standalone login $(CODEPUSH_SERVER_URL) \\\\
		--accessKey "$(TOKEN)"

# Release to Staging (both platforms)
codepush-release-staging:
	code-push-standalone release-react MyApp-ios ios \\\\
		--deploymentName Staging --description "$(msg)"
	code-push-standalone release-react MyApp-android android \\\\
		--deploymentName Staging --description "$(msg)"

# Release to Production (both platforms)
codepush-release-production:
	code-push-standalone release-react MyApp-ios ios \\\\
		--deploymentName Production --description "$(msg)"
	code-push-standalone release-react MyApp-android android \\\\
		--deploymentName Production --description "$(msg)"

# Promote Staging → Production for all apps
codepush-promote:
	code-push-standalone promote MyApp-ios Staging Production
	code-push-standalone promote MyApp-android Staging Production

# List deployment keys
codepush-keys:
	code-push-standalone deployment ls MyApp-ios -k
	code-push-standalone deployment ls MyApp-android -k

# Show release history
codepush-history:
	code-push-standalone deployment history MyApp-ios Staging
	code-push-standalone deployment history MyApp-ios Production`}
            />

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Usage:
            </p>
            <CodeBlock
              language="bash"
              code="# Release to Staging
make codepush-release-staging msg='Added new home screen'

# Promote staging build to production
make codepush-promote

# List all deployment keys
make codepush-keys"
            />
          </div>
        </StepCard>
      </div>

      {/* ======================================== */}
      {/* Step 8: Advanced */}
      {/* ======================================== */}
      <div id="advanced">
        <StepCard
          icon={<Cpu className="h-5 w-5" />}
          title="8. Advanced Usage"
          description="Granular control over update behavior"
        >
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Manual Sync
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Trigger update checks programmatically instead of automatically:
              </p>
              <div className="mt-3">
                <CodeBlock
                  language="jsx"
                  code={`
import codePush from 'react-native-code-push';
import { Alert } from 'react-native';

async function checkForUpdate() {
  const remotePackage = await codePush.checkForUpdate();

  if (!remotePackage) {
    Alert.alert('Up to date', 'Your app is already on the latest version.');
    return;
  }

  // Download the update
  await remotePackage.download((progress) => {
    const percent = (progress.receivedBytes / progress.totalBytes * 100).toFixed(0);
    console.log(\`Downloading: \${percent}%\`);
  });

  // Apply the update
  if (remotePackage.isMandatory) {
    await remotePackage.install(codePush.InstallMode.IMMEDIATE);
    codePush.restartApp();
  } else {
    await remotePackage.install(codePush.InstallMode.ON_NEXT_RESUME);
    Alert.alert('Update ready', 'The update will be applied next time you open the app.');
  }
}
`}
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Update Progress UI
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Show a download progress bar to users:
              </p>
              <div className="mt-3">
                <CodeBlock
                  language="jsx"
                  code={`
import React, { useState, useEffect } from 'react';
import codePush from 'react-native-code-push';
import { View, Text, ProgressBar } from 'react-native';

function UpdateManager({ children }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    codePush.sync(
      {},
      (syncStatus) => {
        if (syncStatus === codePush.SyncStatus.DOWNLOADING_PACKAGE) {
          // Progress will be updated via the next callback
        }
      },
      (downloadProgress) => {
        const percent = downloadProgress.receivedBytes / downloadProgress.totalBytes;
        setProgress(percent);
      },
    );
  }, []);

  if (progress !== null && progress < 1) {
    return (
      <View>
        <Text>Downloading update...</Text>
        <ProgressBar progress={progress} />
      </View>
    );
  }

  return children;
}
`}
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Get Current Update Metadata
              </h4>
              <CodeBlock
                language="javascript"
                code={`
// Check which update is currently running
const metadata = await codePush.getUpdateMetadata();
if (metadata) {
  console.log('App Version:', metadata.appVersion);
  console.log('Label:', metadata.label);        // e.g., v1, v2
  console.log('Is Mandatory:', metadata.isMandatory);
  console.log('Is First Run:', metadata.isFirstRun);
  console.log('Failed Install:', metadata.failedInstall);
}

// Check if there's a pending update to be applied
const pendingUpdate = await codePush.getUpdateMetadata(
  codePush.UpdateState.PENDING
);
if (pendingUpdate) {
  // An update is downloaded but waiting for app restart
}
`}
              />
            </div>
          </div>
        </StepCard>
      </div>

      {/* ======================================== */}
      {/* Troubleshooting */}
      {/* ======================================== */}
      <div id="troubleshooting">
        <StepCard
          icon={<Wrench className="h-5 w-5" />}
          title="Troubleshooting"
          description="Common issues and how to fix them"
        >
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-700">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-dark-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-dark-800">
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Symptom</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Likely Cause</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Solution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">Update not showing</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Wrong deployment key</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Verify the deployment key in Info.plist / build.gradle matches the server</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">Connection refused</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Server URL incorrect or server down</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Check CodePushServerURL (iOS) / ServerUrl (Android). Verify server is running with <code>curl</code></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">401 Unauthorized</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Invalid or expired access key</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Generate a new access key via REST API and update CLI login + GitHub Secrets</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">App crashes after update</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Bundle incompatibility</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Rollback to previous version via <code>code-push-standalone promote</code> or HyperPush Console</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">iOS: CodePushServerURL not found</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Info.plist not configured</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Add CodePushServerURL key to Info.plist. The SDK reads this natively via CodePushConfig.m</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">Android: ServerUrl not found</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">build.gradle resValue missing</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Add <code>resValue "string", "ServerUrl", "..."</code> in each flavor block</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-100">CLI: "code-push-standalone: command not found"</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Not installed globally</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Run <code>npm install -g code-push-standalone</code>. Use absolute path from <code>npm root -g</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </StepCard>
      </div>

      {/* ======================================== */}
      {/* External Resources */}
      {/* ======================================== */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">External Resources</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ExternalLinkCard
            href="https://github.com/microsoft/react-native-code-push"
            title="react-native-code-push"
            description="Official Microsoft SDK on GitHub (React Native)"
          />
          <ExternalLinkCard
            href="https://github.com/lisong/code-push-server"
            title="lisong/code-push-server"
            description="Self-hosted CodePush server (our setup)"
          />
          <ExternalLinkCard
            href="https://github.com/slooob/code-push-standalone"
            title="code-push-standalone CLI"
            description="Standalone CLI for self-hosted CodePush servers"
          />
        </div>
      </div>
    </div>
  );
}
