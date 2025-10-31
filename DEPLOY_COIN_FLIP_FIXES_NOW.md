# 🚀 DEPLOY COIN FLIP FIXES TO HETZNER - IMMEDIATE ACTION REQUIRED

## Files Updated Locally (Ready to Deploy)
✅ `dist/test-tubes.html` - Client-side fixes (copied from public/)
✅ `server/PhysicsGameManager.js` - Server-side race condition fixes

---

## Option 1: Quick PM2 Deployment (Recommended)

If you're using PM2 on Hetzner, run these commands:

### Step 1: Connect to your server
```bash
ssh root@<your-hetzner-ip>
# or
ssh root@hetzner159
```

### Step 2: Navigate to your app directory
```bash
cd /var/www/flipnosis
# or wherever your app is located
```

### Step 3: Pull latest changes (if using git)
```bash
git pull origin main
```

### Step 4: Restart PM2
```bash
pm2 restart all
pm2 logs --lines 50
```

---

## Option 2: Manual File Upload (If not using Git)

### From Windows PowerShell (run from this folder):

```powershell
# Replace with your actual server IP and path
$SERVER = "root@<your-server-ip>"
$REMOTE_PATH = "/var/www/flipnosis"

# Upload client file
scp dist/test-tubes.html "${SERVER}:${REMOTE_PATH}/dist/test-tubes.html"

# Upload server file
scp server/PhysicsGameManager.js "${SERVER}:${REMOTE_PATH}/server/PhysicsGameManager.js"

# Restart server via SSH
ssh $SERVER "cd ${REMOTE_PATH} && pm2 restart all"
```

---

## Option 3: Using deployment script in this repo

```bash
# If you have deploy-to-hetzner.sh
./deploy-to-hetzner.sh

# Or if you have a PM2 ecosystem file
pm2 deploy production
```

---

## CRITICAL: Server Must Be Restarted!

After uploading files, you **MUST** restart the Node.js server:

```bash
# Option A: PM2
pm2 restart all

# Option B: Systemd
sudo systemctl restart flipnosis

# Option C: Direct Node
pkill node
npm start
```

---

## Verify Deployment

### 1. Check server logs for the new code:
```bash
pm2 logs --lines 100
# Look for these new log messages:
# "✅ FIX: Clear flipping flag"
# "⚠️ Round end already in progress, skipping duplicate"
```

### 2. Test in browser:
- Hard refresh (Ctrl+Shift+R) to clear cache
- Open browser console (F12)
- Look for: "✅ ALL ASSETS PRELOADED - Game ready!"
- Try flipping both coins simultaneously
- Should NOT see "Game Error: Cannot flip coin now"

### 3. Check for the loading screen:
- Refresh page
- Should briefly see "⚡ LOADING GAME"
- No white screen

---

## What Each Fix Does

### Server: `PhysicsGameManager.js`
- ✅ Prevents duplicate `endRound()` calls when multiple players flip at once
- ✅ Adds `isFlipping` flag to prevent double-click flips
- ✅ Properly clears flags on round reset

### Client: `test-tubes.html`
- ✅ Smooth coin landing with no snapback
- ✅ Prevents animation conflicts with `isLanding` flag
- ✅ Preloads all materials during initial load
- ✅ Shows loading indicator instead of white screen

---

## Troubleshooting

### If you still see "Cannot flip coin now":
1. Check server logs: `pm2 logs | grep "Player.*cannot fire"`
2. This will show WHY the flip was rejected
3. Common causes:
   - `hasFired: true` - Player already flipped this round
   - `isActive: false` - Player was eliminated
   - `choice: null` - Player didn't select heads/tails

### If coin still snaps back:
1. Hard refresh browser (Ctrl+Shift+R)
2. Check console for: `tube.isLanding` should be `true` during landing
3. Check console for: `updateCoinRotationsFromPlayerChoices` should NOT run during landing

### If simultaneous flips still break:
1. Check server logs for: "🏁 Round ending triggered"
2. Should only appear ONCE per round
3. If appears multiple times, server wasn't restarted properly

---

## Files Changed Summary

| File | Changes | Impact |
|------|---------|--------|
| `public/test-tubes.html` | 200+ lines | Client animations, preloading |
| `dist/test-tubes.html` | Same (copied) | Production file |
| `server/PhysicsGameManager.js` | 20 lines | Race conditions, flags |

---

## Quick Test Checklist

After deployment:

- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] See loading screen briefly
- [ ] Both players can flip simultaneously
- [ ] No "Cannot flip coin now" error
- [ ] Coin lands smoothly without snapback
- [ ] Round advances correctly
- [ ] No console errors

---

## Emergency Rollback

If something breaks badly:

```bash
ssh root@<server>
cd /var/www/flipnosis

# Restore from backup
cp /tmp/flipnosis-backup-<timestamp>/dist/test-tubes.html dist/
cp /tmp/flipnosis-backup-<timestamp>/server/PhysicsGameManager.js server/

# Restart
pm2 restart all
```

---

**STATUS**: ✅ Files ready to deploy
**NEXT STEP**: Upload to Hetzner and restart server
**TESTING**: Required after deployment

