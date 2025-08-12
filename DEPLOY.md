# 🚀 Flipnosis Deployment Guide

## Quick Deployment (Git Direct Push)

### Deploy to Hetzner Production
```powershell
# 1. Deploy your changes
.\deployment\deploy-hetzner-git-fixed.ps1 "Your commit message"

# 2. Check deployment status
.\deployment\check-hetzner-status-fixed.ps1 -ServerIP 159.69.242.154
```

### Server Details
- **Production Server**: `159.69.242.154` (Flipnosis App)
- **Database Server**: `116.202.24.43` (Flipnosis DB)
- **Domain**: `https://www.flipnosis.fun`

### How It Works
1. Code is committed and pushed to Hetzner git repository
2. Post-receive hook automatically builds and deploys the app
3. Service restarts automatically with zero downtime
4. Status check verifies deployment success

### Architecture Notes
- **Server-Based Game Logic**: All game logic runs on the server
- **Client Communication**: Clients send messages via WebSocket
- **Singleton WebSocket Service**: Single instance manages all connections
- **Direct Git Deployment**: No intermediate CI/CD - direct push to production

### Troubleshooting
- If deployment fails, check the post-receive hook output
- Use status check script to verify all services are running
- WebSocket errors should be resolved with singleton pattern

---
*This deployment method replaces all previous deployment approaches*
