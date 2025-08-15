# 🚀 Quick Deployment Guide for Flipnosis.fun

## ✅ **Credentials Ready**
- **Private Key**: `f19dd56173918d384a2ff2d73905ebc666034b6abd34312a074b4a80ddb2e80c`
- **Wallet Address**: `0x47d80671bcb7ec368ef4d3ca6e1c20173ccc9a28`
- **Contract**: `0xF5fdE838AB5aa566AC7d1b9116523268F39CC6D0`
- **Server IP**: `143.198.166.196`

## 🔧 **Deployment Steps**

### **Step 1: SSH into your DigitalOcean droplet**
```bash
ssh root@143.198.166.196
```

### **Step 2: Clone and setup the repository**
```bash
# Navigate to home directory
cd /root

# Clone your repository (replace with your actual GitHub repo URL)
git clone https://github.com/your-username/flipnosis-digitalocean.git
cd flipnosis-digitalocean

# Copy the environment template (already configured with your credentials)
cp digitalocean-deploy/env-template.txt digitalocean-deploy/.env
```

### **Step 3: Deploy the application**
```bash
# Navigate to deployment directory
cd digitalocean-deploy

# Make deployment script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

### **Step 4: Verify deployment**
```bash
# Check if containers are running
docker-compose ps

# Check application health
curl http://localhost/health
```

## 🎯 **Expected Results**

After successful deployment:
- ✅ `http://143.198.166.196` - Should load your application
- ✅ `https://www.flipnosis.fun` - Should load your application
- ✅ All game functionality should work properly

## 🔍 **Troubleshooting**

If deployment fails:

```bash
# Check Docker status
systemctl status docker

# Check container logs
docker-compose logs app
docker-compose logs nginx

# Restart containers
docker-compose down
docker-compose up -d
```

## 📋 **Environment Variables (Already Configured)**

The `digitalocean-deploy/env-template.txt` file now contains:
- ✅ Your private key
- ✅ Your wallet address for fees
- ✅ Contract address
- ✅ RPC URL
- ✅ All necessary configuration

## 🎉 **Ready to Deploy!**

Your application is now ready to be deployed to DigitalOcean. The environment is properly configured with your credentials, and the deployment script will handle the rest.

**Next step**: SSH into your droplet and run the deployment commands above.
