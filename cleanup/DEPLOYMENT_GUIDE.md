# 🚀 Flipnosis Deployment Guide

## **Overview**
This guide covers the clean, reliable deployment process for Flipnosis. No more Docker canvas issues!

## **Prerequisites**
- Windows PowerShell
- SSH access to Digital Ocean droplet (143.198.166.196)
- Git repository set up

## **Quick Start**

### **First Time Setup**
1. **Set up the server:**
   ```powershell
   .\setup-server.ps1
   ```

2. **Deploy your application:**
   ```powershell
   .\deploy.ps1
   ```

### **Regular Deployments**
For future updates, just run:
```powershell
.\deploy.ps1
```

## **How It Works**

### **1. Git Backup**
- Creates a backup branch with timestamp
- Commits any uncommitted changes
- Pushes to GitHub for safety

### **2. Local Build**
- Builds the React app locally (no canvas issues)
- Creates a clean deployment package
- Includes all necessary files

### **3. Server Deployment**
- Uploads built files to server
- Sets up environment variables
- Configures SSL certificates
- Restarts services

### **4. Cleanup**
- Removes temporary files
- Cleans up old backup branches (keeps last 5)

## **File Structure**

```
Flipnosis - Digital Ocean/
├── deploy.ps1              # Main deployment script
├── setup-server.ps1        # Server setup script
├── .gitignore              # Clean gitignore
├── src/                    # React source code
├── server/                 # Server code
├── contracts/              # Smart contracts
├── scripts/                # Database scripts
└── public/                 # Static assets
```

## **Deployment Options**

### **Full Deployment (with backup)**
```powershell
.\deploy.ps1
```

### **Deployment without backup**
```powershell
.\deploy.ps1 -SkipBackup
```

### **Deployment with custom email**
```powershell
.\deploy.ps1 -Email "your-email@example.com"
```

## **Troubleshooting**

### **Build Fails**
- Check if all dependencies are installed: `npm install`
- Verify Node.js version: `node --version` (should be 20+)

### **Deployment Fails**
- Check SSH connection: `ssh root@143.198.166.196`
- Verify server is running: `systemctl status flipnosis-app`

### **Domain Not Working**
- Check DNS settings in GoDaddy
- Verify SSL certificates: `ls -la /etc/nginx/ssl/`
- Check nginx logs: `tail -f /var/log/nginx/error.log`

## **Server Management**

### **Check Application Status**
```bash
ssh root@143.198.166.196 "systemctl status flipnosis-app"
```

### **View Logs**
```bash
ssh root@143.198.166.196 "journalctl -u flipnosis-app -f"
```

### **Restart Application**
```bash
ssh root@143.198.166.196 "systemctl restart flipnosis-app"
```

### **Check Nginx Status**
```bash
ssh root@143.198.166.196 "systemctl status nginx"
```

## **Backup and Recovery**

### **Git Backups**
- Automatic backup branches created before each deployment
- Format: `backup-YYYYMMDD-HHMMSS`
- Last 5 backups kept automatically

### **Server Backups**
- Current deployment backed up before each update
- Format: `backup-YYYYMMDD-HHMMSS`
- Located in `/opt/flipnosis/`

### **Restore from Backup**
```bash
ssh root@143.198.166.196 "cd /opt/flipnosis && mv current-deployment broken-deployment && mv backup-YYYYMMDD-HHMMSS current-deployment && systemctl restart flipnosis-app"
```

## **Environment Variables**

The deployment uses these environment variables:
- `DATABASE_URL`: SQLite database path
- `CONTRACT_ADDRESS`: Smart contract address
- `CONTRACT_OWNER_KEY`: Private key for contract operations
- `RPC_URL`: Blockchain RPC endpoint
- `NODE_ENV`: Production environment

## **SSL Certificates**

SSL certificates are automatically managed:
- Created on first deployment
- Auto-renewed every 60 days
- Stored in `/etc/nginx/ssl/`

## **Performance Monitoring**

### **Check Resource Usage**
```bash
ssh root@143.198.166.196 "htop"
```

### **Monitor Disk Space**
```bash
ssh root@143.198.166.196 "df -h"
```

### **Check Memory Usage**
```bash
ssh root@143.198.166.196 "free -h"
```

## **Security**

- Application runs as root (for simplicity)
- SSL certificates automatically configured
- Nginx configured with security headers
- Regular system updates via setup script

## **Support**

If you encounter issues:
1. Check the logs: `journalctl -u flipnosis-app -f`
2. Verify deployment: `systemctl status flipnosis-app`
3. Test connectivity: `curl http://localhost:3000/health`

## **Migration from Docker**

This new system replaces the Docker-based deployment:
- **Faster**: No Docker build times
- **More reliable**: No canvas compilation issues
- **Easier to debug**: Direct systemd services
- **Better performance**: Native Node.js execution

The old Docker files can be safely removed after confirming the new system works. 