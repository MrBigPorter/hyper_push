# CodePush CLI Guide

> How to install, login, and use the CodePush CLI with your HyperPush self-hosted server.

---

## Prerequisites

Install the CodePush CLI globally:

```bash
npm install -g code-push-standalone
```

Verify installation:

```bash
code-push-standalone --version
```

---

## Login

### One-Click Login (Recommended)

1. Open the HyperPush Dashboard
2. Navigate to **Servers** → select your server → **Server Detail**
3. Scroll to the **One-Click CLI Login** section
4. Click **Copy Login Command**
5. Paste the command in your terminal:

```bash
code-push-standalone login https://cp.hyperpush.org/codepush --accessKey <your-token>
```

Expected output:

```
Successfully logged-in.
```

### Manual Access Key Creation

If you need to create an access key manually:

1. In the **Server Detail** page, scroll to **CodePush Access Keys**
2. Click **Create Key**
3. Copy the displayed key value
4. Login with:

```bash
code-push-standalone login https://cp.hyperpush.org/codepush --accessKey <your-token>
```

---

## Verify Login

Check your access keys:

```bash
code-push-standalone access-key list
```

Expected output shows your active access keys (names are hidden for security):

```
[access keys]
```

---

## Logout

```bash
code-push-standalone logout
```

This removes the stored session token from your local machine. You'll need to login again to use CLI commands.

---

## Managing Access Keys

### From the Dashboard

- **Create**: Server Detail → CodePush Access Keys → Create Key
- **Delete**: Server Detail → CodePush Access Keys → Delete button next to the key
- **One-Click Login**: Server Detail → One-Click CLI Login → Copy Login Command

### From the CLI

```bash
# List all access keys (names only, tokens are hidden)
code-push-standalone access-key list

# Remove an access key by name
code-push-standalone access-key remove <name>
```

---

## Multi-Developer Collaboration

When multiple developers work on the same app, each developer needs their own
access key to release updates independently:

1. **Each developer creates their own key:**
   - Go to **Server Detail** → **CodePush Access Keys** → click **Create Key**
   - A new uniquely-named key is generated instantly (e.g. `key-1718200000`)
   - Copy the displayed key value — it won't be shown again

2. **Each developer logs in with their key:**
   ```bash
   code-push-standalone login https://cp.hyperpush.org/codepush --accessKey <your-key>
   ```

3. **Developers can release updates independently:**
   ```bash
   code-push-standalone release-react MyApp ios --deploymentName Staging
   ```

4. **Revoke individual access:**
   - Server Detail → CodePush Access Keys → Delete next to the developer's key
   - That developer's CLI session will stop working immediately
   - Other developers' keys remain unaffected

> 💡 **Tip:** Each access key has a unique `friendlyName` (e.g. `key-1718200000`).
> While the name auto-generated, you can identify which key belongs to whom
> by asking team members which key name they received.

---

## Troubleshooting

### "Invalid access key"

This usually means the token has expired or is malformed.

1. Go to the **Server Detail** page in the dashboard
2. Click **Copy Login Command** to generate a fresh token
3. Run the new command in your terminal

### "The access key already exists"

Delete the existing key first:

- From the dashboard: Server Detail → CodePush Access Keys → Delete
- Or from CLI: `code-push-standalone access-key remove <name>`

Then create a new one.

### Login succeeds but `app add` fails

Ensure you're logged in to the correct server URL. The server URL must match the one shown in the dashboard:

```bash
code-push-standalone login https://cp.hyperpush.org/codepush --accessKey <token>
```

---

## Common CLI Commands

```bash
# Login
code-push-standalone login <server-url> --accessKey <token>

# Logout
code-push-standalone logout

# List access keys
code-push-standalone access-key list

# Remove an access key
code-push-standalone access-key remove <name>

# Create an app
code-push-standalone app add <appName> <os> <platform>

# List apps
code-push-standalone app list

# Add a deployment
code-push-standalone deployment add <appName> <deploymentName>

# List deployments
code-push-standalone deployment list <appName>

# Release an update
code-push-standalone release-react <appName> <platform> --deploymentName <deploymentName>
```

---

## Related

- [Getting Started](getting-started.md) — Set up HyperPush
- [Deployment Guide](deployment.md) — Deploy to production
