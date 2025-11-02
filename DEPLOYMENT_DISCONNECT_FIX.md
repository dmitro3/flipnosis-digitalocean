# Fix: Local vs Production Disconnect Issue

## Problem
The "CHANGE COIN" button and other features appear locally but not on the Hetzner server, even after deployment.

## Root Cause
Your server serves files from TWO locations (in priority order):
1. **`public/` folder** - Takes priority (line 112-132 in server.js)
2. **`dist/` folder** - Fallback (line 134-157 in server.js)

When you run `npm run build`, Vite:
- Copies `public/` folder → `dist/public/`
- But if old files exist in `dist/public/`, they might override your changes

## Solutions

### Solution 1: Direct Public Folder Deployment (RECOMMENDED)

Deploy directly to the `public` folder on your server:

```powershell
.\deploy-public-files-direct.ps1
```

This script:
- Uploads files directly to `public/` (which takes priority)
- Bypasses the build process
- Ensures your latest changes are live immediately

### Solution 2: Fix Git Deployment Hook

Your Git post-receive hook needs to:
1. Clean the `dist/public` folder before building
2. Run a fresh build with your latest code
3. Copy from `dist/public` back to `public/` OR serve from `dist/public`

Check your post-receive hook on the server:
```bash
ssh root@159.69.242.154 "cat /opt/flipnosis/app/.git/hooks/post-receive"
```

### Solution 3: Manual Deployment (Quick Fix)

SSH to your server and manually copy files:

```bash
# SSH to server
ssh root@159.69.242.154

# Navigate to app directory
cd /opt/flipnosis/app

# Create backup
cp -r public public.backup.$(date +%Y%m%d_%H%M%S)

# Your files should be in the repo, so pull latest
git pull origin main

# OR manually copy if files are already there
# The files should be in: /opt/flipnosis/app/public/

# Restart server
pm2 restart flipnosis-app
```

### Solution 4: Verify What's Being Served

Check what files actually exist on the server:

```bash
ssh root@159.69.242.154 "ls -la /opt/flipnosis/app/public/js/game-main.js"
ssh root@159.69.242.154 "ls -la /opt/flipnosis/app/dist/public/js/game-main.js 2>/dev/null || echo 'No dist/public'"
```

Check the file content to see if it has the latest code:
```bash
ssh root@159.69.242.154 "grep -n 'CHANGE COIN' /opt/flipnosis/app/public/js/game-main.js"
```

## Quick Diagnostic Commands

```bash
# Check if files exist
ssh root@159.69.242.154 "cd /opt/flipnosis/app && find . -name 'game-main.js' -type f"

# Check file modification dates
ssh root@159.69.242.154 "ls -lh /opt/flipnosis/app/public/js/game-main.js"

# Check what the server logs say it's serving
ssh root@159.69.242.154 "pm2 logs flipnosis-app --lines 50 | grep -i 'serving\|public\|dist'"
```

## Recommended Action Plan

1. **Immediate Fix**: Run `.\deploy-public-files-direct.ps1` to upload files directly
2. **Verify**: Check that files exist on server: `ssh root@159.69.242.154 "ls -la /opt/flipnosis/app/public/js/"`
3. **Restart**: `ssh root@159.69.242.154 "pm2 restart flipnosis-app"`
4. **Test**: Visit your live site and check browser console
5. **Long-term**: Fix your Git post-receive hook to properly handle builds

## Why This Happens

- Your local Vite dev server serves directly from `public/` folder
- Your production server serves from `public/` first, then `dist/`
- When you build, Vite copies `public/` to `dist/public/`, but if the build is stale or doesn't run, old files remain
- Git push might not trigger a rebuild, or the rebuild might use cached/old files

## Prevention

After fixing, ensure your deployment process:
1. Always runs a fresh build: `npm run build`
2. Cleans old dist files: `rm -rf dist/`
3. OR deploys directly to `public/` folder (simpler, no build needed for public files)

