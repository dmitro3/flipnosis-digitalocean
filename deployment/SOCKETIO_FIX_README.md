# Socket.io WebSocket Connection Fix

## Problem
The client is trying to connect to Socket.io but the WebSocket connection is failing with:
```
WebSocket connection to 'wss://flipnosis.fun/socket.io/?EIO=4&transport=websocket' failed
```

## Root Cause
Nginx is not properly configured to proxy WebSocket connections for Socket.io. The `/socket.io/` location block needs:

1. **Proper ordering** - Must come BEFORE the main `/` location block
2. **WebSocket upgrade headers** - `Upgrade` and `Connection` headers
3. **Disabled buffering** - For real-time data transmission
4. **Long timeouts** - WebSocket connections stay open for extended periods

## Quick Fix

### Step 1: Diagnose the Issue
```powershell
.\deployment\diagnose-socketio.ps1
```

This will check:
- ✅ Is nginx running?
- ✅ Is the Node.js server listening on port 3000?
- ✅ Does nginx have the correct Socket.io configuration?
- ✅ Are there any errors in the logs?

### Step 2: Apply the Fix
```powershell
.\deployment\fix-socketio-connection-final.ps1
```

This will:
1. Upload the correct nginx configuration
2. Test the configuration
3. Reload nginx
4. Restart the Node.js server
5. Show you the results

### Step 3: Test
1. Open https://flipnosis.fun in your browser
2. Open the browser console (F12)
3. Look for: `✅ Socket.io connected`

## What the Fix Does

### Before (Broken)
```nginx
# Main location comes first - catches /socket.io/ requests
location / {
    proxy_pass http://localhost:3000;
    # ... basic proxy settings
}

# Socket.io location comes second - never reached!
location /socket.io/ {
    # ... WebSocket settings
}
```

### After (Fixed)
```nginx
# Socket.io location comes FIRST - specific routes first
location /socket.io/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    
    # WebSocket upgrade headers
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # Disable buffering for real-time data
    proxy_buffering off;
    
    # Long timeouts for persistent connections
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}

# Main location comes SECOND - catches everything else
location / {
    proxy_pass http://localhost:3000;
    # ... basic proxy settings
}
```

## Key Configuration Points

### 1. Location Block Order Matters
Nginx processes location blocks in a specific order. More specific paths should come before general ones.

### 2. WebSocket Upgrade Headers
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```
These headers tell nginx to upgrade the HTTP connection to WebSocket.

### 3. Disable Buffering
```nginx
proxy_buffering off;
```
Buffering breaks real-time WebSocket communication.

### 4. Extended Timeouts
```nginx
proxy_read_timeout 86400;  # 24 hours
proxy_send_timeout 86400;  # 24 hours
```
WebSocket connections can stay open for long periods.

## Troubleshooting

### If WebSocket still fails after applying the fix:

1. **Check if the server is running:**
   ```bash
   ssh root@159.69.242.154 "pm2 list"
   ```

2. **Check server logs:**
   ```bash
   ssh root@159.69.242.154 "pm2 logs flipnosis"
   ```

3. **Check nginx logs:**
   ```bash
   ssh root@159.69.242.154 "tail -f /var/log/nginx/error.log"
   ```

4. **Test Socket.io locally on server:**
   ```bash
   ssh root@159.69.242.154 "curl -v 'http://localhost:3000/socket.io/?EIO=4&transport=polling'"
   ```
   Should return HTTP 200

5. **Check firewall:**
   ```bash
   ssh root@159.69.242.154 "ufw status"
   ```

## Technical Details

### Socket.io Connection Flow
1. Client requests: `wss://flipnosis.fun/socket.io/?EIO=4&transport=websocket`
2. Nginx receives the request on port 443 (HTTPS)
3. Nginx matches the `/socket.io/` location block
4. Nginx upgrades the connection to WebSocket
5. Nginx proxies to Node.js server on `localhost:3000`
6. Node.js Socket.io server handles the WebSocket connection
7. Real-time bidirectional communication established

### Why Order Matters
```nginx
# ❌ WRONG - General location catches /socket.io/ first
location / { ... }
location /socket.io/ { ... }  # Never reached

# ✅ CORRECT - Specific location catches /socket.io/ first  
location /socket.io/ { ... }  # Handles Socket.io
location / { ... }            # Handles everything else
```

## Files Modified
- `nginx.conf` - Updated with correct configuration
- `deployment/fix-socketio-connection-final.ps1` - Automated fix script
- `deployment/diagnose-socketio.ps1` - Diagnostic script

## Next Steps
After fixing, your GlassTubeGame should connect successfully via Socket.io without any WebSocket errors!

