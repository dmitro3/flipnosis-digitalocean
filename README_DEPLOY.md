# 🚀 DEPLOYMENT SYSTEM - READ THIS FIRST!

## Your Deployment is Now FIXED!

I've set up a complete deployment system that solves your Cloudflare caching issues.

---

## 🎯 THE ONE COMMAND YOU NEED

```powershell
.\DEPLOY.ps1 "what you changed"
```

That's it! This command:
- ✅ Builds your code locally
- ✅ Commits changes to git
- ✅ Pushes to Hetzner server  
- ✅ Rebuilds on server
- ✅ Restarts PM2
- ✅ Purges Cloudflare cache (if configured)
- ✅ **PROTECTS your database** (never overwrites)

---

## 🔥 QUICK START (Do This Now)

### For Testing (Easiest - No Setup):

```powershell
# 1. Deploy
.\DEPLOY.ps1 "my changes"

# 2. Test via direct IP (bypasses Cloudflare)
http://159.69.242.154/test-tubes.html?gameId=YOUR_GAME_ID&room=potion
```

**Done!** No cache issues, instant feedback.

### For Production Testing (5-Minute Setup):

```powershell
# 1. One-time setup (enable auto cache purge):
.\SETUP_CLOUDFLARE.ps1
# Follow prompts to enter credentials

# 2. Restart PowerShell

# 3. Deploy (cache auto-purges!):
.\DEPLOY.ps1 "my changes"

# 4. Test on real domain:
https://www.flipnosis.fun/test-tubes.html?gameId=...
```

---

## 📚 All Available Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `DEPLOY.ps1` | **Full deployment** | Every time you make changes |
| `TEST_DIRECT.ps1` | Open direct IP in browser | Quick testing without cache |
| `CHECK_LIVE.ps1` | Verify what's on server | When unsure if deploy worked |
| `SETUP_CLOUDFLARE.ps1` | Configure Cloudflare API | One-time setup (optional) |
| `ROLLBACK.ps1` | Restore previous version | Emergency only |
| `SYNC_PUBLIC_TO_DIST.ps1` | Sync folders locally | Local testing only |

---

## 🛡️ Database Protection

**Your database is SAFE!** Every deployment:
1. Creates backup: `database.sqlite.backup.TIMESTAMP`
2. Moves database out of the way
3. Updates code
4. Restores database
5. Keeps 10+ backups automatically

**Location:** `/opt/flipnosis/app/server/database.sqlite`
**Backups:** Same folder with `.backup.TIMESTAMP` suffix

---

## 🎓 What You Learned Today

### The Problem:
```
Cloudflare CDN caches your files for hours
Even after deploying new code, browsers load old cached versions
This made you think the code wasn't deploying
```

### The Solution:
```
During development: Test via direct IP (bypasses cache)
For production: Auto-purge Cloudflare or use Development Mode
```

### Why Your Old Script Failed:
```
.\deployment\deploy-hetzner-git-fixed.ps1:
  ✅ Pushed code to server  
  ✅ Server rebuilt
  ❌ Didn't handle Cloudflare cache
  ❌ No verification step
  ❌ You couldn't tell if it worked
```

### Why New Script Works:
```
.\DEPLOY.ps1:
  ✅ Builds locally first (catches errors early)
  ✅ Pushes and rebuilds server
  ✅ Purges Cloudflare (if configured)
  ✅ Shows verification
  ✅ Clear success/failure messages
  ✅ Tells you exactly what to do next
```

---

## 🚦 Daily Workflow (Copy This!)

```powershell
# MORNING (Once per session):
# Option A: Enable Cloudflare Dev Mode (via dashboard)
# Option B: Just use direct IP for testing

# THEN ALL DAY:
# 1. Make changes to your files...
# 2. Deploy:
.\DEPLOY.ps1 "descriptive message about what you changed"

# 3. Test:
http://159.69.242.154/test-tubes.html?gameId=...

# 4. Repeat!
```

**That's it!** No more wasted tokens, no more confusion.

---

## ⚡ Pro Tips

1. **During active development:**
   - Always test via `http://159.69.242.154` (no cache!)
   - Use Cloudflare domain only for final testing

2. **If something breaks:**
   - Run `.\ROLLBACK.ps1` to restore previous version
   - Server keeps 10+ backups automatically

3. **To verify deployment worked:**
   - Run `.\CHECK_LIVE.ps1`
   - Shows exactly what's on the server

4. **If browser still shows old code:**
   - Use incognito mode (Ctrl+Shift+N/P)
   - Or test via direct IP

---

## 🎯 Your Questions Answered

### 1. Are you following best practice?

**NOW you are!** With these scripts:
- ✅ Git-based deployment (industry standard)
- ✅ Automated builds
- ✅ Database protection
- ✅ Cache management
- ✅ Rollback capability

### 2. Should you purge Cloudflare every time?

**During development: YES!**
- Set up DEPLOY.ps1 with Cloudflare credentials
- It auto-purges on every deploy
- Takes 2 seconds, saves you hours

**In production: Selective purging**
- But you're not there yet

### 3. One-command solution?

**YES! `.\DEPLOY.ps1`** does everything.

Optional: Add Cloudflare credentials (5 min setup) for auto-purge.

---

## 📞 Quick Help

**Not working?**
1. Run: `.\CHECK_LIVE.ps1` - Is server updated?
2. Test: `http://159.69.242.154` - Bypass cache
3. Try: Incognito mode - Fresh browser

**Database lost?**
1. Check: `/opt/flipnosis/app/server/database.sqlite.backup.*`
2. Run: `.\ROLLBACK.ps1` - Restores everything

**Need help?**
- Read: `DEPLOYMENT_BEST_PRACTICES.md`
- Read: `QUICK_DEPLOY_GUIDE.md`

---

## 🎉 You're All Set!

**Everything is configured for easy, reliable deployments.**

**Next time you make changes:**
```powershell
.\DEPLOY.ps1 "what I changed"
```

**Then test via:**
```
http://159.69.242.154/test-tubes.html?gameId=...
```

**No more confusion. No more wasted tokens. Just deploy and test!**

---

**Key Files to Remember:**
- `DEPLOY.ps1` ← Your main deployment command
- `QUICK_DEPLOY_GUIDE.md` ← Quick reference
- `TEST_DIRECT.ps1` ← Bypass cache for testing

**Bookmark this file!** You'll refer to it often.


