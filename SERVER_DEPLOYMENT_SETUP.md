# Server-Side Git Pull Deployment Setup

This guide explains how to set up a simple server-side deployment script that pulls from git and redeploys the application.

## Overview

The `server-deploy.sh` script provides a streamlined deployment process directly on the server:
1. Pulls latest code from git
2. Installs dependencies
3. Builds production assets
4. Restarts the flipnosis service

## Initial Server Setup

### 1. Copy the deployment script to the server

```bash
scp server-deploy.sh deploy@116.202.24.43:/tmp/deploy.sh
```

### 2. SSH into the server and set up the script

```bash
ssh deploy@116.202.24.43
```

Then on the server:

```bash
# Create the flipnosis directory if it doesn't exist
sudo mkdir -p /srv/flipnosis

# Move the script to the correct location
sudo mv /tmp/deploy.sh /srv/flipnosis/deploy.sh

# Make it executable
sudo chmod +x /srv/flipnosis/deploy.sh

# Set proper ownership (optional, adjust user as needed)
sudo chown deploy:deploy /srv/flipnosis/deploy.sh
```

### 3. Ensure the application directory exists

```bash
# The script expects the application to be at /srv/flipnosis/app
# If your app is elsewhere, either:
# - Move it to /srv/flipnosis/app, OR
# - Edit the script to point to the correct location

# Example: Create app directory and clone repository
cd /srv/flipnosis
sudo git clone https://github.com/AlphaSocial/flipnosis-digitalocean.git app
cd app
sudo chown -R deploy:deploy .
```

### 4. Configure git to allow directory operations

```bash
cd /srv/flipnosis/app
git config --global --add safe.directory /srv/flipnosis/app
```

### 5. Set up sudoers for passwordless service restart (if needed)

If the deploy user doesn't have permission to restart services without a password:

```bash
sudo visudo
```

Add this line (replace `deploy` with your actual username):

```
deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart flipnosis.service, /bin/systemctl status flipnosis.service
```

## Usage

### Deploy from your local machine

Simply run:

```bash
ssh deploy@116.202.24.43 'bash /srv/flipnosis/deploy.sh'
```

Or create a local script/alias for convenience:

```bash
# Add to your .bashrc or .zshrc
alias deploy-flipnosis="ssh deploy@116.202.24.43 'bash /srv/flipnosis/deploy.sh'"
```

Then just run:

```bash
deploy-flipnosis
```

### Deploy from within the server

If you're already SSH'd into the server:

```bash
bash /srv/flipnosis/deploy.sh
```

Or:

```bash
/srv/flipnosis/deploy.sh
```

## What the Script Does

1. **Changes directory** to `/srv/flipnosis/app`
2. **Pulls latest code** with `git pull`
3. **Installs dependencies** with `npm install --production`
4. **Builds assets** with `npm run build:production`
5. **Restarts service** with `sudo systemctl restart flipnosis.service`
6. **Checks status** to verify the service started successfully

## Customization

### If you need to reload nginx

Add this line before the final echo:

```bash
sudo systemctl reload nginx
```

Don't forget to add nginx reload to sudoers:

```
deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart flipnosis.service, /bin/systemctl status flipnosis.service, /bin/systemctl reload nginx
```

### If your app directory is different

Edit the script and change:

```bash
cd /srv/flipnosis/app
```

To your actual path, for example:

```bash
cd /opt/flipnosis/app
```

### If you don't use systemd

Replace the systemctl commands with your process manager:

```bash
# For PM2:
pm2 restart flipnosis

# For manual process:
pkill -f 'node.*server.js'
nohup node server/server.js > server.log 2>&1 &
```

## Troubleshooting

### Permission denied when pulling from git

```bash
# Ensure SSH keys are set up for git
ssh-keygen -t ed25519 -C "deploy@flipnosis"
cat ~/.ssh/id_ed25519.pub
# Add this key to your GitHub repository settings
```

### Permission denied when restarting service

Add the appropriate line to sudoers as shown in step 5 above.

### Build fails

Check that all required environment variables are set:

```bash
# Check if .env file exists
ls -la /srv/flipnosis/app/.env

# Or check if environment is set in systemd service
sudo systemctl cat flipnosis.service
```

### Service won't start

Check logs:

```bash
sudo journalctl -u flipnosis.service -n 50 -f
```

## Integration with Existing Workflow

This server-side deployment script complements your existing PowerShell deployment scripts:

- **Use `DEPLOY.ps1`** for full local build and deployment with Cloudflare cache purging
- **Use server-side script** for quick deployments when you've already pushed changes to git

### Workflow Example

```bash
# On your local machine:
git add .
git commit -m "Update feature X"
git push

# Then deploy to server:
ssh deploy@116.202.24.43 'bash /srv/flipnosis/deploy.sh'
```

Or combine them:

```bash
git add . && git commit -m "Update feature X" && git push && ssh deploy@116.202.24.43 'bash /srv/flipnosis/deploy.sh'
```

## Notes

- The script uses `set -e` which means it will stop on any error
- Each step is logged with clear output
- The service status is checked at the end to verify successful deployment
- This is a simpler alternative to the packaged deployment system
