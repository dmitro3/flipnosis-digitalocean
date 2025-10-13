# Manual Socket.io WebSocket Fix - Step by Step

## The Problem
Your browser can't connect to Socket.io because nginx isn't properly configured for WebSocket connections.

## Quick Fix - Copy and Paste These Commands

### Step 1: Upload the Fixed nginx Config
Open PowerShell or Git Bash and run:

```bash
scp nginx.conf root@159.69.242.154:/etc/nginx/sites-available/flipnosis.fun
```

### Step 2: Create Symbolic Link
```bash
ssh root@159.69.242.154 "ln -sf /etc/nginx/sites-available/flipnosis.fun /etc/nginx/sites-enabled/flipnosis.fun"
```

### Step 3: Test nginx Configuration
```bash
ssh root@159.69.242.154 "nginx -t"
```

You should see: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

### Step 4: Reload nginx
```bash
ssh root@159.69.242.154 "systemctl reload nginx"
```

### Step 5: Restart the Node.js Server
```bash
ssh root@159.69.242.154 "pm2 restart flipnosis"
```

### Step 6: Check Logs
```bash
ssh root@159.69.242.154 "pm2 logs flipnosis --lines 30"
```

Look for:
- ✅ `Socket.io server initialized`
- ✅ `Server listening on port 3000`

### Step 7: Test in Browser
1. Go to https://flipnosis.fun
2. Open browser console (F12)
3. You should see: `✅ Socket.io connected`

---

## Alternative: All-in-One Command

If you want to run everything at once, copy this entire block:

```bash
# Upload, test, and restart everything
scp nginx.conf root@159.69.242.154:/etc/nginx/sites-available/flipnosis.fun && \
ssh root@159.69.242.154 "ln -sf /etc/nginx/sites-available/flipnosis.fun /etc/nginx/sites-enabled/flipnosis.fun && nginx -t && systemctl reload nginx && pm2 restart flipnosis && pm2 logs flipnosis --lines 20"
```

---

## Troubleshooting

### If WebSocket still fails:

**Check if server is running:**
```bash
ssh root@159.69.242.154 "pm2 list"
```

**Check if port 3000 is listening:**
```bash
ssh root@159.69.242.154 "netstat -tulpn | grep 3000"
```

**View live server logs:**
```bash
ssh root@159.69.242.154 "pm2 logs flipnosis"
```
(Press Ctrl+C to exit)

**Check nginx errors:**
```bash
ssh root@159.69.242.154 "tail -f /var/log/nginx/error.log"
```
(Press Ctrl+C to exit)

**Test Socket.io locally on server:**
```bash
ssh root@159.69.242.154 'curl -v "http://localhost:3000/socket.io/?EIO=4&transport=polling"'
```
Should return HTTP 200

---

## What Changed

The key fix was **reordering the nginx location blocks**:

### ❌ Before (Broken):
```nginx
# Main location catches everything, including /socket.io/
location / {
    proxy_pass http://localhost:3000;
}

# Never reached because / caught it first
location /socket.io/ {
    # WebSocket config
}
```

### ✅ After (Fixed):
```nginx
# Specific Socket.io location comes FIRST
location /socket.io/ {
    proxy_pass http://localhost:3000;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_buffering off;
    # ... other WebSocket settings
}

# General location comes SECOND
location / {
    proxy_pass http://localhost:3000;
}
```

The `/socket.io/` block MUST come before the `/` block for nginx to route WebSocket connections correctly!

---

## Need Help?

If you still see WebSocket errors after following these steps:

1. Take a screenshot of the browser console errors
2. Run: `ssh root@159.69.242.154 "pm2 logs flipnosis --lines 50"` and share the output
3. Run: `ssh root@159.69.242.154 "cat /etc/nginx/sites-enabled/flipnosis.fun"` to verify the config

The issue should be resolved after following these steps! 🎉

