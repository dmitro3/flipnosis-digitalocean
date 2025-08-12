# Git-Based Deployment System for Hetzner

This directory contains improved scripts for setting up and using a Git-based deployment system to your Hetzner server. This replaces the previous multi-script approach with a clean, single-command deployment flow.

## Files Overview

- `setup-hetzner-git-deploy-fixed.ps1` - One-time server setup script
- `deploy-hetzner-git-fixed.ps1` - Deploy your code with a single command
- `check-hetzner-status-fixed.ps1` - Check server status and logs
- `test-git-deploy.ps1` - Troubleshooting and diagnostic script

## Quick Start

### 1. One-Time Setup

Run the setup script once to configure your server:

```powershell
.\deployment\setup-hetzner-git-deploy-fixed.ps1 -ServerIP YOUR_SERVER_IP -ServerUser root
```

This script will:
- Generate SSH keys for passwordless authentication
- Install Node.js 20, Git, and Nginx on your server
- Create a bare Git repository
- Set up systemd service
- Configure Nginx with SSL
- Install a post-receive hook for automatic deployment

### 2. Configure Environment

SSH to your server and edit the environment file:

```bash
ssh root@YOUR_SERVER_IP
nano /opt/flipnosis/shared/.env
```

Add your real secrets:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=your_database_url
CONTRACT_ADDRESS=your_contract_address
CONTRACT_OWNER_KEY=your_private_key
RPC_URL=your_rpc_url
VITE_ALCHEMY_API_KEY=your_alchemy_key
VITE_PLATFORM_FEE_RECEIVER=your_fee_receiver
```

### 3. Deploy

Deploy your application with a single command:

```powershell
.\deployment\deploy-hetzner-git-fixed.ps1 "Your commit message"
```

### 4. Check Status

Verify your deployment:

```powershell
.\deployment\check-hetzner-status-fixed.ps1 -ServerIP YOUR_SERVER_IP
```

## What Happens During Deployment

1. **Local Actions:**
   - Commits all changes to Git
   - Pushes to the `hetzner` remote repository

2. **Server Actions (Automatic via post-receive hook):**
   - Checks out the latest code to `/opt/flipnosis/app`
   - Links the environment file
   - Runs `npm ci` to install dependencies
   - Runs `npm run build` to build the application
   - Restarts the `flipnosis-app` systemd service

3. **Health Checks:**
   - Tests HTTP and HTTPS endpoints
   - Verifies the application is responding

## Server Directory Structure

```
/opt/flipnosis/
├── repo.git/          # Bare Git repository
├── app/               # Deployed application code
└── shared/
    └── .env           # Environment configuration
```

## Troubleshooting

### Run Diagnostic Script

If something isn't working, run the test script:

```powershell
.\deployment\test-git-deploy.ps1 -ServerIP YOUR_SERVER_IP
```

This will check:
- SSH connectivity
- SSH key authentication
- Git repository setup
- Server dependencies
- Environment configuration
- Systemd service status

### Common Issues

1. **SSH Connection Failed**
   - Verify server IP and SSH access
   - Check if SSH is running on port 22
   - Ensure your user has SSH access

2. **SSH Key Authentication Failed**
   - Re-run the setup script
   - Manually copy your public key: `ssh-copy-id root@YOUR_SERVER_IP`

3. **Git Push Failed**
   - Ensure the hetzner remote is configured: `git remote -v`
   - Check if you have uncommitted changes: `git status`

4. **Application Not Starting**
   - Check logs: `ssh root@YOUR_SERVER_IP 'journalctl -u flipnosis-app -f'`
   - Verify environment file has correct values
   - Check if port 3001 is available

5. **Nginx Not Working**
   - Test Nginx config: `ssh root@YOUR_SERVER_IP 'nginx -t'`
   - Restart Nginx: `ssh root@YOUR_SERVER_IP 'systemctl restart nginx'`

### Manual Commands

Useful commands for debugging:

```bash
# Check service status
ssh root@YOUR_SERVER_IP 'systemctl status flipnosis-app'

# View live logs
ssh root@YOUR_SERVER_IP 'journalctl -u flipnosis-app -f'

# Restart application
ssh root@YOUR_SERVER_IP 'systemctl restart flipnosis-app'

# Check running processes
ssh root@YOUR_SERVER_IP 'ps aux | grep node'

# Test local connectivity
ssh root@YOUR_SERVER_IP 'curl http://localhost:3001/health'
```

## Security Notes

- Environment variables with secrets are stored only on the server in `/opt/flipnosis/shared/.env`
- No secrets are committed to Git or transferred during deployment
- SSL is configured with self-signed certificates (upgrade to Let's Encrypt for production)
- SSH key authentication is used for passwordless deployment

## Advantages Over Previous System

1. **Single Command Deployment:** Just run one script to deploy
2. **No Password Prompts:** SSH key authentication eliminates repeated password entry
3. **Atomic Deployments:** Git ensures consistent state
4. **Automatic Restarts:** Post-receive hook handles service restart
5. **Environment Security:** Secrets stay on the server
6. **Built-in Health Checks:** Automatic verification after deployment

## Migration from Previous System

If you were using the old deployment scripts, you can switch to this system by:

1. Running the setup script once
2. Configuring your environment file on the server
3. Using the new deploy script instead of the old ones

The old scripts can be kept as backup but are no longer needed for regular deployments.
