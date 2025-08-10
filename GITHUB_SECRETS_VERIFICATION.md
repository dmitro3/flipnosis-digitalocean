# 🔐 GitHub Secrets Verification Guide

## 📋 **Required GitHub Repository Secrets**

Navigate to your GitHub repository: `https://github.com/AlphaSocial/flipnosis-digitalocean`

### **Settings → Secrets and variables → Actions**

You need these secrets configured:

#### **🔑 Digital Ocean Connection Secrets**
```
DIGITALOCEAN_HOST = 143.198.166.196
DIGITALOCEAN_USERNAME = root
DIGITALOCEAN_PASSWORD = [your-server-password]
DIGITALOCEAN_SSH_KEY = [your-private-ssh-key]
DIGITALOCEAN_PORT = 22
```

#### **🔧 Application Environment Secrets**
```
VITE_CONTRACT_ADDRESS = [your-contract-address]
VITE_ALCHEMY_API_KEY = [your-alchemy-key]
VITE_CHAIN_ID = [your-chain-id]
```

#### **🗄️ Database Secrets**
```
DATABASE_URL = [your-database-connection-string]
CONTRACT_ADDRESS = [your-contract-address]
CONTRACT_OWNER_KEY = [your-contract-owner-private-key]
RPC_URL = [your-rpc-endpoint]
```

## 🔍 **How to Verify Secrets**

### **1. Check if Secrets Exist**
- Go to your GitHub repository
- Click "Settings" tab
- Click "Secrets and variables" → "Actions"
- Verify all required secrets are present

### **2. Test SSH Connection**
Run this command to test SSH connectivity:
```bash
ssh -i [path-to-your-private-key] root@143.198.166.196
```

### **3. Verify Server Status**
Once connected, check if your application is running:
```bash
docker ps
docker-compose ps
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: SSH Timeout**
**Symptoms**: GitHub Actions fails with SSH timeout
**Solutions**:
1. Verify server is online: `ping 143.198.166.196`
2. Check SSH service: `systemctl status ssh`
3. Verify firewall: `ufw status`

### **Issue 2: Wrong Credentials**
**Symptoms**: Authentication failed
**Solutions**:
1. Regenerate SSH key pair
2. Update GitHub secrets
3. Verify username/password

### **Issue 3: Port Blocked**
**Symptoms**: Connection refused
**Solutions**:
1. Check if port 22 is open
2. Verify Digital Ocean firewall rules
3. Check server firewall settings
