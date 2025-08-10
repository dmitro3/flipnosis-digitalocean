# 🚀 Git & Digital Ocean Deployment Verification Guide

## 🎯 **Current Status Summary**

✅ **Working Components:**
- Git repository connected to GitHub
- Docker configuration properly set up
- GitHub Actions workflows configured
- Build process (after fixing database lock)

❌ **Issues Found:**
- Database file locked during build
- Environment template missing key variables
- Need to verify GitHub secrets
- Need to test SSH connectivity

---

## 📋 **Step-by-Step Verification Process**

### **Step 1: Fix Local Build Issues**

#### **1.1 Clear Build Cache**
```powershell
# Stop any running Node.js processes
taskkill /f /im node.exe

# Remove dist directory
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue

# Clear npm cache
npm cache clean --force
```

#### **1.2 Test Build Process**
```powershell
# Test the build
npm run build:production
```

### **Step 2: Verify GitHub Repository Secrets**

#### **2.1 Access GitHub Repository Settings**
1. Go to: `https://github.com/AlphaSocial/flipnosis-digitalocean`
2. Click "Settings" tab
3. Click "Secrets and variables" → "Actions"

#### **2.2 Required Secrets Checklist**
Verify these secrets exist:

**🔑 Digital Ocean Connection:**
- `DIGITALOCEAN_HOST` = `143.198.166.196`
- `DIGITALOCEAN_USERNAME` = `root`
- `DIGITALOCEAN_PASSWORD` = [your server password]
- `DIGITALOCEAN_SSH_KEY` = [your private SSH key]
- `DIGITALOCEAN_PORT` = `22`

**🔧 Application Environment:**
- `VITE_CONTRACT_ADDRESS` = [your contract address]
- `VITE_ALCHEMY_API_KEY` = [your Alchemy key]
- `VITE_CHAIN_ID` = `8453`

**🗄️ Database & Contract:**
- `DATABASE_URL` = `sqlite:./server/games.db`
- `CONTRACT_ADDRESS` = [your contract address]
- `CONTRACT_OWNER_KEY` = [your contract owner private key]
- `RPC_URL` = [your RPC endpoint]

### **Step 3: Test SSH Connection to Digital Ocean**

#### **3.1 Test Basic Connectivity**
```powershell
# Test if server is reachable
ping 143.198.166.196

# Test SSH connection (if you have SSH key)
ssh -i [path-to-your-key] root@143.198.166.196
```

#### **3.2 Verify Server Status**
Once connected, run these commands:
```bash
# Check if Docker is running
docker --version
docker-compose --version

# Check running containers
docker ps

# Check if your app directory exists
ls -la /root/flipnosis-digitalocean
```

### **Step 4: Test Manual Deployment**

#### **4.1 Run Local Deployment Script**
```powershell
# Run the simple deployment script
.\deploy-simple.ps1
```

#### **4.2 Manual Server Deployment**
If the script works, manually deploy to test:
```bash
# SSH into your server
ssh root@143.198.166.196

# Navigate to your app directory
cd /root/flipnosis-digitalocean

# Pull latest changes
git pull origin main

# Stop existing containers
cd digitalocean-deploy
docker-compose down

# Build and start containers
docker-compose build --no-cache
docker-compose up -d

# Check logs
docker-compose logs -f
```

### **Step 5: Test GitHub Actions Deployment**

#### **5.1 Trigger Manual Workflow**
1. Go to your GitHub repository
2. Click "Actions" tab
3. Select "Deploy to DigitalOcean" workflow
4. Click "Run workflow" → "Run workflow"

#### **5.2 Monitor Deployment**
- Watch the workflow logs in real-time
- Check for any error messages
- Verify the deployment completes successfully

---

## 🔧 **Troubleshooting Common Issues**

### **Issue 1: SSH Timeout**
**Symptoms:** GitHub Actions fails with SSH timeout
**Solutions:**
1. Verify server is online: `ping 143.198.166.196`
2. Check SSH service: `systemctl status ssh`
3. Verify firewall: `ufw status`
4. Check Digital Ocean firewall rules

### **Issue 2: Authentication Failed**
**Symptoms:** SSH authentication fails
**Solutions:**
1. Regenerate SSH key pair
2. Update GitHub secrets with new key
3. Verify username/password in secrets

### **Issue 3: Build Fails**
**Symptoms:** Application build fails
**Solutions:**
1. Clear build cache
2. Stop running Node.js processes
3. Check for locked files
4. Verify all dependencies are installed

### **Issue 4: Container Issues**
**Symptoms:** Docker containers fail to start
**Solutions:**
1. Check Docker logs: `docker-compose logs`
2. Verify environment variables
3. Check disk space: `df -h`
4. Restart Docker service: `systemctl restart docker`

---

## 🎯 **Success Criteria**

Your deployment is working correctly when:

✅ **GitHub Actions:**
- Workflow runs without errors
- Build completes successfully
- SSH connection established
- Deployment completes

✅ **Digital Ocean Server:**
- Application accessible at `http://143.198.166.196`
- All containers running: `docker ps` shows 3 containers
- No error logs: `docker-compose logs` shows no errors
- Database initialized and working

✅ **Application:**
- Frontend loads correctly
- Backend API responds
- WebSocket connections work
- Database operations function

---

## 📞 **Next Steps After Verification**

1. **If everything works:** Set up automatic deployments on push
2. **If issues found:** Follow troubleshooting steps above
3. **For production:** Set up SSL certificate and domain
4. **For monitoring:** Set up health checks and logging

---

## 🔗 **Useful Commands Reference**

```bash
# Server Status
docker ps
docker-compose ps
docker-compose logs -f

# Application Health
curl http://143.198.166.196/health
curl http://143.198.166.196/api/status

# Database Check
docker-compose exec app node scripts/check-db-schema.js

# Manual Restart
docker-compose down
docker-compose up -d

# View Real-time Logs
docker-compose logs -f app
```
