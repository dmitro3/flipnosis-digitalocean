# Socket.io Fixes - Deployment Summary

## Issues Fixed

1. **Socket.io 404 Error** - Changed from script tag to ES module import
2. **Syntax Error in game-main.js:634** - Fixed closing brace from `});` to `};`
3. **Syntax Error in update-client-state.js:327** - Fixed indentation and brace structure
4. **Module Resolution Error** - Added socket.io-client to import map

## Files Modified

### 1. `public/test-tubes.html`
- **Added** socket.io-client to import map:
```javascript
"socket.io-client": "https://cdn.socket.io/4.8.1/socket.io.esm.min.js"
```
- **Removed** the script tag: `<script src="/socket.io/socket.io.js"></script>`

### 2. `public/js/core/socket-manager.js`
- **Changed** from checking `typeof io === 'undefined'` to ES module import:
```javascript
import { io } from 'socket.io-client';
```
- **Updated** socket connection to handle dev/prod environments:
```javascript
const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  forceNew: false,
  autoConnect: true
});
```

### 3. `public/js/game-main.js`
- **Fixed** line 635: Changed `});` to `};` to properly close object declaration

### 4. `public/js/core/update-client-state.js`
- **Fixed** indentation on line 308 and brace structure around lines 324-327

### 5. `vite.config.js`
- **Added** proxy configuration for `/socket.io` and `/api`:
```javascript
proxy: {
  '/socket.io': {
    target: 'http://localhost:3000',
    ws: true,
    changeOrigin: true
  },
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true
  }
}
```

## Deployment to Hetzner Server

### Step 1: Backup Current Files
```bash
# SSH into your Hetzner server
ssh user@your-server-ip

# Navigate to your project directory
cd /path/to/your/project

# Create backup
cp -r public public.backup.$(date +%Y%m%d_%H%M%S)
```

### Step 2: Copy Modified Files

Upload these files to your Hetzner server:
1. `public/test-tubes.html`
2. `public/js/core/socket-manager.js`
3. `public/js/game-main.js`
4. `public/js/core/update-client-state.js`
5. `vite.config.js` (if you're using Vite in production)

### Step 3: Production Socket.io Configuration

For production on Hetzner, the socket should connect to the same origin since both frontend and backend are on the same server. The socket-manager.js already handles this automatically.

However, if your frontend is served separately (e.g., from a CDN), update the socket connection:

In `public/js/core/socket-manager.js`, for production:
```javascript
// Production: Connect to your backend server
const socketUrl = window.location.protocol === 'https:' 
  ? 'https://flipnosis.fun' 
  : 'http://flipnosis.fun';
  
const socket = io(socketUrl, { /* options */ });
```

### Step 4: Verify Server Configuration

Ensure your server (Express/Node.js) is running and socket.io is properly configured on port 3000 (or your configured port).

### Step 5: Test

1. Navigate to `https://flipnosis.fun/test-tubes.html`
2. Open browser console (F12)
3. Check for:
   - ✅ "Connected to server" message
   - No WebSocket connection errors
   - Game initializes properly

## Quick Deploy Script

```bash
#!/bin/bash
# deploy-socket-fixes.sh

SERVER="user@your-server-ip"
REMOTE_PATH="/path/to/project"

echo "🚀 Deploying socket.io fixes..."

# Upload files
scp public/test-tubes.html $SERVER:$REMOTE_PATH/public/
scp public/js/core/socket-manager.js $SERVER:$REMOTE_PATH/public/js/core/
scp public/js/game-main.js $SERVER:$REMOTE_PATH/public/js/
scp public/js/core/update-client-state.js $SERVER:$REMOTE_PATH/public/js/core/

echo "✅ Files uploaded!"
echo "⚠️  Restart your server if needed"
```

## Notes

- The import map uses CDN for socket.io-client, which works in both dev and production
- Socket connection automatically detects environment (dev uses direct connection to :3000, prod uses same origin)
- All syntax errors have been fixed
- The game should now properly connect to the socket.io server

## Troubleshooting

If socket still doesn't connect in production:
1. Check that your Express server is running
2. Verify CORS settings allow your domain
3. Check nginx configuration for WebSocket support (if using nginx)
4. Verify port 3000 (or your configured port) is open
5. Check server logs for socket.io errors

