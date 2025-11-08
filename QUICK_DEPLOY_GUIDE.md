# Quick Deployment Guide - Save This!

## Every Time You Make Changes:

### SIMPLE METHOD (Best for You):

**Step 1: Deploy**
```powershell
.\DEPLOY.ps1 "what you changed"
```

**Step 2: Test via Direct IP (NO CACHE!)**
```
http://159.69.242.154/test-tubes.html?gameId=YOUR_GAME_ID&room=potion
```

**Done!** No cache issues, instant feedback.

---

## Why This Works

### The Problem You Had:
```
You → Push code → Server updates → Cloudflare caches old files → Browser loads old code → You waste time debugging
```

### The Solution:
```
You → DEPLOY.ps1 → Server updates → Test via direct IP → See changes immediately!
```

---

## Scripts Reference

### `DEPLOY.ps1` - Full Deployment
Does everything: build, commit, push, rebuild server, restart PM2
```powershell
.\DEPLOY.ps1 "Fixed coin animations"
```

### `TEST_DIRECT.ps1` - Quick Test
Opens direct IP in browser (bypasses Cloudflare)
```powershell
.\TEST_DIRECT.ps1
```

### `CHECK_LIVE.ps1` - Verify Deployment
Shows what's actually on the server
```powershell
.\CHECK_LIVE.ps1
```

### `SYNC_PUBLIC_TO_DIST.ps1` - Local Sync
Syncs public folder to dist (for local testing only)
```powershell
.\SYNC_PUBLIC_TO_DIST.ps1
```

---

## Cloudflare: Development Mode

**For Heavy Development Sessions:**

1. Go to: https://dash.cloudflare.com
2. Select: `flipnosis.fun`
3. Go to: Caching → Configuration
4. Turn ON: "Development Mode"
5. Good for: 3 hours of cache-free testing

Then just use the normal domain:
```
https://www.flipnosis.fun/test-tubes.html?gameId=...
```

---

## Troubleshooting

### "Changes not showing?"
1. Did you run `DEPLOY.ps1`? (not just git push)
2. Are you testing via direct IP? (159.69.242.154)
3. Are you in incognito mode? (Ctrl+Shift+N/P)
4. Is Cloudflare Development Mode on?

### "Failed to join game?"
- Old code still cached
- Run `CHECK_LIVE.ps1` to verify server has new code
- Use direct IP to test
- Clear browser cache completely

### "Database lost?"
- The post-receive hook protects it
- Check backups: `/opt/flipnosis/app/server/database.sqlite.backup.*`
- Multiple backups created automatically

---

## Your Daily Workflow

```powershell
# Morning: Enable Cloudflare Development Mode (once)
# Then all day long:

# Make changes to files...
.\DEPLOY.ps1 "Added feature X"
# Open: http://159.69.242.154/test-tubes.html?gameId=...
# Test it

# Make more changes...
.\DEPLOY.ps1 "Fixed bug Y"  
# Test it

# Make more changes...
.\DEPLOY.ps1 "Updated UI Z"
# Test it

# End of day: Turn off Cloudflare Development Mode (optional)
```

---

## File Structure

**Where You Edit:**
```
public/
  ├── js/
  ├── test-tubes.html
  └── ... 
```

**What Gets Deployed:**
```
dist/
  ├── assets/
  │   └── index-HASH.js  ← Vite bundle (auto-generated)
  ├── js/               ← Individual modules (for test-tubes.html)
  ├── index.html        ← Main React app
  └── test-tubes.html   ← Test tubes game
```

**On Hetzner Server:**
```
/opt/flipnosis/app/dist/  ← Server serves from here
```

---

## Database Protection Explained

The post-receive hook has these safeguards:

1. **Backup**: Creates timestamped backup before every deploy
2. **Move**: Temporarily moves database out before code checkout
3. **Restore**: Puts database back after checkout
4. **Verify**: Only restores if new database is too small (<1MB)

**Your database is SAFE!**

Location: `/opt/flipnosis/app/server/database.sqlite`
Backups: `/opt/flipnosis/app/server/database.sqlite.backup.*`

---

## Summary

✅ **Use `DEPLOY.ps1`** for all deployments
✅ **Test via direct IP** (159.69.242.154) during development  
✅ **Enable Cloudflare Dev Mode** for active dev sessions
✅ **Database is protected** automatically
✅ **One command** does everything

**This will save you hundreds of dollars in tokens and hours of frustration!**

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────┐
│ DEPLOYMENT COMMAND                              │
│ .\DEPLOY.ps1 "what changed"                     │
├─────────────────────────────────────────────────┤
│ TEST URL (NO CACHE)                             │
│ http://159.69.242.154/test-tubes.html           │
├─────────────────────────────────────────────────┤
│ VERIFY DEPLOYMENT                               │
│ .\CHECK_LIVE.ps1                                │
├─────────────────────────────────────────────────┤
│ CLOUDFLARE DEV MODE                             │
│ dash.cloudflare.com → Caching → Dev Mode ON    │
└─────────────────────────────────────────────────┘
```

Save this card! Use it every time you deploy.




