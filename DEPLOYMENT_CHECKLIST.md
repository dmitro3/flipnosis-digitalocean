# 🚀 Quick Deployment Checklist

## Pre-Deployment
- [ ] All changes committed to git
- [ ] No uncommitted files
- [ ] Server code tested locally (optional)

## Deployment Steps

### 1. Commit Changes
```bash
git status
git add .
git commit -m "Fix server crashes - add comprehensive error handling"
git push origin main
```

### 2. Deploy to Hetzner
Use your existing deployment method. The server should automatically:
- Pull latest code
- Restart PM2 process
- Apply all error handling fixes

### 3. Verify Server is Running
```bash
# Check if website loads
curl -I https://www.flipnosis.fun/

# Should return HTTP 200 instead of 521
```

### 4. Check Health Endpoint
```bash
curl https://www.flipnosis.fun/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": 123,
  "socketio": "active",
  "database": "connected",
  "blockchain": "ready",
  "memory": {
    "heapUsed": "XX MB",
    "heapTotal": "XX MB",
    "rss": "XX MB"
  }
}
```

### 5. Monitor Logs (SSH to Hetzner)
```bash
# View real-time logs
pm2 logs flipnosis-app

# View recent logs
pm2 logs flipnosis-app --lines 100

# Check for these indicators:
# ✅ "Clean Game Server initialized successfully"
# ✅ "Database initialized"
# ✅ "Socket.io server initialized"
# ✅ "CryptoFlipz Server Running"
```

## Post-Deployment Verification

### Test Website
1. Open https://www.flipnosis.fun/ in browser
2. Should load without 521 errors
3. Try connecting wallet
4. Try creating a game
5. Check console for errors

### Monitor for 10 Minutes
```bash
pm2 monit
```
Watch for:
- Memory not growing rapidly
- No repeated restarts
- CPU usage normal

## If Server Still Crashes

### Check Logs for Specific Error
```bash
pm2 logs flipnosis-app --err --lines 50
```

### Check PM2 Status
```bash
pm2 status
pm2 describe flipnosis-app
```

### Manual Restart
```bash
pm2 restart flipnosis-app
pm2 logs flipnosis-app --lines 50
```

### Emergency: Full PM2 Reset
```bash
pm2 delete flipnosis-app
pm2 start ecosystem.config.js
pm2 logs flipnosis-app
```

## Success Indicators ✅

You'll know it's working when:
- [ ] No 521 errors when accessing website
- [ ] `/health` endpoint returns 200 status
- [ ] PM2 shows "online" status
- [ ] Logs show "Server Running" message
- [ ] No repeated restarts in PM2
- [ ] Memory usage stable

## Common Issues & Solutions

### Issue: "Database not found"
```bash
# Check if database exists
ls -la /path/to/your/project/server/flipz.db

# If missing, check if it's in project root
ls -la /path/to/your/project/flipz.db
```

### Issue: "Port already in use"
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 pm2 restart flipnosis-app
```

### Issue: "Module not found"
```bash
# Reinstall dependencies
cd /path/to/your/project
npm install
pm2 restart flipnosis-app
```

## Need More Info?

See `SERVER_CRASH_FIX.md` for detailed explanation of all fixes.

---

**Ready to deploy?** Follow steps 1-5 above! 🚀

