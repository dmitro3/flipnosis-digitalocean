# Deployment Best Practices for Flipnosis

## Your Questions Answered

### 1. Are You Following Best Practice?

**Current Setup: ALMOST, but missing one critical piece**

Your git-based deployment is **good**, but you need to handle **Cloudflare caching**.

**Current Flow:**
```
Local Changes → Git Commit → Push to Hetzner → Post-receive Hook → npm build → PM2 restart
                                                                           ↓
                                                                    [CACHED by Cloudflare]
                                                                           ↓
                                                                    Old files served to users
```

**What's Missing:** Cloudflare cache invalidation

### 2. Should You Purge Cloudflare Every Time?

**YES during active development!** Here's the reality:

#### During Development (NOW):
- ✅ **Purge every deploy** - You're making frequent changes
- ✅ **Or use Development Mode** - Disables caching for 3 hours
- ✅ **Or test via direct IP** - Bypasses Cloudflare entirely

#### In Production (Later):
- ⚠️ **Selective purge** - Only purge changed URLs
- ⚠️ **Or use cache-busting** - Add version numbers to files
- ⚠️ **Or cache rules** - Set shorter cache times for JS/CSS

### 3. Complete Deployment Solution

I've created **`DEPLOY.ps1`** - a one-command deployment script that:
1. ✅ Builds locally
2. ✅ Commits changes
3. ✅ Pushes to Hetzner
4. ✅ Rebuilds on server
5. ✅ Restarts PM2
6. ✅ Purges Cloudflare (if credentials set)
7. ✅ Verifies deployment
8. ✅ **PROTECTS DATABASE** (never overwrites)

## Setup Instructions

### Option A: With Cloudflare Auto-Purge (RECOMMENDED)

1. **Get Cloudflare Credentials:**
   - Go to https://dash.cloudflare.com
   - Select your domain: `flipnosis.fun`
   - Get Zone ID: Dashboard → Overview → Zone ID (right sidebar)
   - Get API Key: My Profile → API Tokens → Global API Key

2. **Set Environment Variables (One-Time Setup):**
   ```powershell
   # Run these commands once:
   [Environment]::SetEnvironmentVariable('CLOUDFLARE_EMAIL', 'your@email.com', 'User')
   [Environment]::SetEnvironmentVariable('CLOUDFLARE_API_KEY', 'your_global_api_key', 'User')
   [Environment]::SetEnvironmentVariable('CLOUDFLARE_ZONE_ID', 'your_zone_id', 'User')
   
   # Restart PowerShell after setting variables
   ```

3. **Deploy (Every Time You Make Changes):**
   ```powershell
   .\DEPLOY.ps1 "Your commit message"
   ```

   This will:
   - Build
   - Push
   - Rebuild on server
   - Purge Cloudflare automatically
   - Ready in 2-3 minutes

### Option B: Without Cloudflare API (Simpler)

If you don't want to set up Cloudflare API:

1. **Enable Cloudflare Development Mode (3-hour bypass):**
   - Go to Cloudflare Dashboard
   - Caching → Configuration
   - Turn ON "Development Mode"
   - This disables caching for 3 hours

2. **Deploy:**
   ```powershell
   .\DEPLOY.ps1 "Your commit message"
   ```

3. **Refresh browser** - No cache issues!

### Option C: Test via Direct IP (Instant)

During development, bypass Cloudflare completely:

```
Direct URL: http://159.69.242.154/test-tubes.html?gameId=...
```

**Pros:**
- ✅ NO caching issues
- ✅ See changes immediately
- ✅ No Cloudflare setup needed

**Cons:**
- ⚠️ No HTTPS (but fine for testing)
- ⚠️ Different URL (but fine for development)

## Your Recommended Workflow

For the work you have ahead, I recommend **Option B or C**:

### During Heavy Development (NOW):
```powershell
# One-time: Enable Cloudflare Development Mode (lasts 3 hours)
# Then just run:
.\DEPLOY.ps1 "Fixed coin selection"

# Test via direct IP for instant feedback:
http://159.69.242.154/test-tubes.html?gameId=...

# Or use your domain after deployment:
https://www.flipnosis.fun/test-tubes.html?gameId=...
```

### When Making Many Quick Changes:
```powershell
# Deploy and test multiple times quickly:
.\DEPLOY.ps1 "Fix 1" && Start-Process "http://159.69.242.154"
# Make more changes...
.\DEPLOY.ps1 "Fix 2" && Start-Process "http://159.69.242.154"
# Make more changes...
.\DEPLOY.ps1 "Fix 3" && Start-Process "http://159.69.242.154"
```

## Database Protection

Your current `post-receive` hook already protects the database:

```bash
# Backs up database before deployment
cp database.sqlite database.sqlite.backup.$(date +%Y%m%d_%H%M%S)

# Moves database out before code checkout
mv database.sqlite database.sqlite.tmp

# Deploys code...

# Restores database after
mv database.sqlite.tmp database.sqlite
```

**This is GOOD!** The database is safe.

## Additional Helper Scripts

I'll create a few more useful scripts:

### Quick Test (No Deploy):
```powershell
.\TEST_DIRECT.ps1  # Opens browser to direct IP
```

### Check What's Live:
```powershell
.\CHECK_LIVE.ps1   # Shows what code is on server
```

### Emergency Rollback:
```powershell
.\ROLLBACK.ps1     # Reverts to previous deployment
```

Would you like me to create these additional scripts?

## Summary of Best Practices

### ✅ DO:
1. **Use `DEPLOY.ps1`** for all deployments
2. **Enable Cloudflare Development Mode** during active development
3. **Test via direct IP** (159.69.242.154) for instant feedback
4. **Keep database backups** (automatic in post-receive hook)
5. **Use incognito mode** when testing to avoid cache

### ❌ DON'T:
1. **Don't trust domain immediately after deploy** - Cloudflare caches
2. **Don't manually purge Cloudflare** every time - automate it
3. **Don't test in normal browser** during development - cache issues
4. **Don't worry about database** - it's protected
5. **Don't push without building** - DEPLOY.ps1 handles it

## Time Savings

**Before (Your current pain):**
- Deploy → Wait → Test → Nothing changed → Debug for hours → Realize it's cache → Waste tokens

**After (With this system):**
- Run `.\DEPLOY.ps1 "message"` → 2 minutes → Test direct IP → Works immediately

---

**Ready to save you hours of frustration! The scripts are set up to make your life easy.**





