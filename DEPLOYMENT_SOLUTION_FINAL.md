# 🎯 DEPLOYMENT SOLUTION - How I Finally Got It Working

## Date: November 7, 2025

---

## 🔴 The Core Problem

Your deployment had **THREE separate caching layers** preventing updates from reaching the browser:

### Layer 1: Browser Cache
- Even with hard refresh, ES6 modules stay cached
- Each imported file caches independently

### Layer 2: Nginx Server Cache  
- Server was caching `/assets/` for 1 year
- `Cache-Control: "public, immutable"`

### Layer 3: Cloudflare CDN Cache
- Caches everything globally
- Even after server updates, Cloudflare serves old files

---

## ✅ How I Fixed Deployment

### Fix #1: ES6 Module Cache-Busting (CRITICAL!)

**Problem**: Changed `coin-manager.js`, but browser served cached version

**Solution**: Added version parameter to ALL imports

```javascript
// test-tubes.html
<script type="module" src="./js/init.js?v=777PINK"></script>

// init.js
import { initGame } from './game-main.js?v=777PINK';
import { toggleMute } from './utils/audio.js?v=777PINK';

// game-main.js
import * as CoinManager from './systems/coin-manager.js?v=777PINK';
import * as GlassShatter from './systems/glass-shatter.js?v=777PINK';
// ... ALL imports get ?v=777PINK
```

**Result**: Browser loads fresh copies every time you change the version!

---

### Fix #2: Copy Files to dist/ (CRITICAL!)

**Problem**: You edit files in `public/`, but nginx serves from `dist/`

**Solution**: Updated post-receive hook to auto-copy after build

```bash
# /opt/flipnosis/repo.git/hooks/post-receive
if grep -q '"build"' package.json; then
    npm run build
    
    # ✅ NEW: Copy test-tubes files to dist/
    cp -f public/test-tubes.html dist/
    cp -rf public/js dist/
    cp -rf public/Sound dist/
    echo "✅ Test tubes files copied to dist/"
fi
```

**Result**: Every deploy now automatically copies your game files to the served directory!

---

### Fix #3: Disable Nginx Caching During Development

**Problem**: Nginx cached files for 1 year with "immutable" flag

**Solution**: Changed caching headers

```bash
# Old (BAD):
expires 1y;
add_header Cache-Control "public, immutable";

# New (GOOD for dev):
expires -1;
add_header Cache-Control "no-store, no-cache, must-revalidate";
```

**Result**: Server always serves latest files!

---

## 🎮 Game Bugs Fixed

### Bug #1: Coin Not Spinning ✅

**Error**: `TypeError: Cannot read properties of undefined (reading '0')`

**Root Cause**: Line 129 in `coin-manager.js` called:
```javascript
animateCoinFlip(data.playerSlot, data.power, data.duration);
// Missing: tubes, coins, coinMaterials!
```

**Fix**:
```javascript
animateCoinFlip(data.playerSlot, data.power, data.duration, tubes, coins, coinMaterials);
```

---

### Bug #2: Round 2 Choices Not Resetting ✅

**Error**: Players couldn't choose heads/tails in round 2

**Root Cause**: Lines 163-166 in `update-client-state.js`:
```javascript
// OLD (BAD):
if (localPlayer.choice && serverPlayer.choice === null) {
  console.log(`WARN: keeping local choice: ${localPlayer.choice}`);
  // Doesn't clear it!
}
```

**Fix**:
```javascript
// NEW (GOOD):
if (localPlayer.choice && serverPlayer.choice === null) {
  console.log(`CLEAR: clearing local choice`);
  localPlayer.choice = null; // ✅ Clear it!
}

// ALSO: Clear all player choices when new round starts
if (newRound > oldRound) {
  players.forEach(player => {
    player.choice = null;
  });
}
```

---

### Bug #3: Mute Button Not Visible ✅

**Problem**: Button existed but wasn't visible

**Fix**: 
1. Used unique ID: `permanent-mute-button-v777`
2. Added all styles inline (can't be overridden)
3. Positioned bottom-right with z-index 999999
4. Hot pink border and glow for visibility

---

## 📋 YOUR DEPLOYMENT WORKFLOW (Going Forward)

### Every Time You Make Changes:

```powershell
# 1. Edit files in public/ or server/
# (Your changes)

# 2. Deploy with DEPLOY.ps1
.\DEPLOY.ps1 "what I changed"

# 3. CRITICAL: Test via DIRECT IP (not flipnosis.fun!)
# Use this script I created:
.\OPEN_DIRECT_IP.ps1

# 4. Look for version marker in console
# You should see: init.js?v=777PINK
# This confirms no caching!

# 5. To change version for next deploy:
# Find-and-replace "v=777PINK" -> "v=888BLUE" in all files
# Or use: "v=20251107" (date-based is clean)
```

---

## 🎯 Why It Finally Worked

### What Made The Difference:

1. **Version parameters on ALL imports** (`?v=777PINK`)
   - Without this: Browser caches nested modules forever
   - With this: Browser loads fresh files every version change

2. **Post-receive hook copies to dist/**
   - Without this: Your changes in `public/` never reach `dist/`
   - With this: Every deploy copies files automatically

3. **Disabled nginx caching**
   - Without this: Server caches for 1 year
   - With this: Server always serves latest

4. **Testing via Direct IP**
   - Without this: Cloudflare serves cached version
   - With this: You bypass Cloudflare completely

---

## ✅ Current Status (as of deploy 04:20 PM UTC)

### What's Working Now:
- ✅ Deployment hook auto-copies files to dist/
- ✅ Version cache-busting works (`?v=777PINK`)
- ✅ Nginx caching disabled
- ✅ Mute button visible (hot pink, bottom-right)
- ✅ Coin animation gets proper parameters
- ✅ Round 2 clears player choices

### What Should Work After Refresh:
- ✅ Coins spin smoothly with progressive rotation
- ✅ Glass shatters immediately (no pause)
- ✅ Round 2 lets players choose heads/tails again
- ✅ Mute button toggles sound (check console for "MUTE BUTTON CLICKED!")

---

## 🔧 For Next Deploy:

### Option A: Use New Version Number

```powershell
# In your IDE, Find-and-Replace across all files:
# Find: ?v=777PINK
# Replace: ?v=888 (or any new version)

# Then deploy:
.\DEPLOY.ps1 "updated to v888"
```

### Option B: Use Date-Based Versions (Recommended!)

```powershell
# Find: ?v=777PINK
# Replace: ?v=20251107 (today's date)

# Then deploy:
.\DEPLOY.ps1 "coin fixes v20251107"
```

Date-based versions are clean and show when changes were made!

---

## 🚨 IMPORTANT: Always Test Direct IP First!

```
DO THIS: http://159.69.242.154/test-tubes.html
NOT THIS: https://flipnosis.fun/test-tubes.html

Why? Direct IP bypasses Cloudflare cache completely!
```

Only test on `flipnosis.fun` AFTER confirming it works on direct IP.

---

## 📊 Deployment Checklist

After running `.\DEPLOY.ps1`:

1. ✅ Check hook output for "Test tubes files copied to dist/"
2. ✅ Check "Application restarted via PM2"
3. ✅ Open DIRECT IP in incognito window
4. ✅ Check console for version marker (e.g. `init.js?v=777PINK`)
5. ✅ Test gameplay (choose, charge, flip)
6. ✅ Check for console errors
7. ✅ If all works: Test on flipnosis.fun
8. ✅ If flipnosis.fun is outdated: Purge Cloudflare

---

## 💾 Summary

### What Was The Problem?
```
You changed files → Committed → Pushed to server → Server updated
BUT
Browser loaded cached JavaScript → Old code ran → Looked broken
```

### What's The Solution?
```
Version all ES6 imports → Browser can't cache → Always loads new code
Auto-copy to dist/ → Nginx serves updated files → No manual steps
Test direct IP → Bypass Cloudflare → See changes instantly
```

---

## 🎉 You're All Set!

Going forward:
1. Edit files
2. Change version number (`?v=777PINK` → `?v=888` or `?v=20251107`)
3. Run `.\DEPLOY.ps1 "message"`
4. Test on `http://159.69.242.154/`
5. Done!

**No more cache mysteries!** 🚀

---

## 📝 Files Modified Today

### Deployment Infrastructure:
- `post-receive-hook.sh` - Auto-copies test-tubes files to dist/
- `OPEN_DIRECT_IP.ps1` - Quick script to open direct IP
- Nginx config - Disabled immutable caching

### Game Code (with v777PINK):
- `public/js/systems/coin-manager.js` - Fixed animation parameters, reference implementation
- `public/js/core/update-client-state.js` - Fixed round 2 choice reset
- `public/js/core/animation-loop.js` - Added landing state protection
- `public/js/init.js` - Mute button setup with logging
- `public/test-tubes.html` - Pink mute button, version parameters

### Version Control:
- All imports now have `?v=777PINK` parameter
- Easy to update for future deploys

---

**Next deploy: Just change "777PINK" to "888" (or use date) and push!** ✅



