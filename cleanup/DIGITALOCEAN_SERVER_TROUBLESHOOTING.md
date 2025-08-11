# 🔧 Digital Ocean Server Troubleshooting Guide

## 🚨 **Current Issue: Server Not Responding**

Your Digital Ocean server at `143.198.166.196` is not responding to ping requests.

---

## 🔍 **Step-by-Step Troubleshooting**

### **Step 1: Check Digital Ocean Dashboard**

1. **Log into Digital Ocean**: https://cloud.digitalocean.com/
2. **Navigate to Droplets**
3. **Find your droplet** (should be named something like "flipnosis" or similar)
4. **Check Status**: Is it running, stopped, or destroyed?

#### **If Droplet is Stopped:**
```bash
# Start the droplet from Digital Ocean dashboard
# Wait 1-2 minutes for it to fully boot
```

#### **If Droplet is Destroyed:**
- You'll need to recreate it
- Follow the setup guide in `DIGITALOCEAN_SETUP_GUIDE.md`

#### **If Droplet is Running:**
- Check the IP address - it might have changed
- Note the new IP address if different

### **Step 2: Verify Server Status**

#### **Option A: Digital Ocean Console**
1. In Digital Ocean dashboard, click on your droplet
2. Click "Console" tab
3. Access the server directly through browser console
4. Run these commands:
```bash
# Check if server is running
uptime

# Check if SSH service is running
systemctl status ssh

# Check if Docker is running
docker --version
docker ps

# Check if your app directory exists
ls -la /root/flipnosis-digitalocean
```

#### **Option B: SSH with Different Methods**
Try these SSH connection methods:

**Method 1: Password Authentication**
```bash
ssh root@143.198.166.196
# Enter your server password when prompted
```

**Method 2: SSH Key Authentication**
```bash
# If you have an SSH key file
ssh -i [path-to-your-private-key] root@143.198.166.196
```

**Method 3: Different Port**
```bash
# Try different SSH ports
ssh -p 2222 root@143.198.166.196
ssh -p 22 root@143.198.166.196
```

### **Step 3: Check Firewall Settings**

#### **Digital Ocean Firewall**
1. Go to Digital Ocean dashboard
2. Navigate to "Networking" → "Firewalls"
3. Check if there's a firewall attached to your droplet
4. Verify these rules exist:
   - **Inbound Rules:**
     - SSH (Port 22) - Allow
     - HTTP (Port 80) - Allow
     - HTTPS (Port 443) - Allow
   - **Outbound Rules:**
     - All Traffic - Allow

#### **Server Firewall (if you can access console)**
```bash
# Check UFW status
ufw status

# If UFW is active, check rules
ufw status numbered

# If needed, allow SSH
ufw allow ssh
ufw allow 22
```

### **Step 4: Check Network Configuration**

#### **Verify IP Address**
```bash
# On the server console, check IP
ip addr show

# Check if IP matches what you expect
hostname -I
```

#### **Check DNS Resolution**
```bash
# Test if server can reach internet
ping google.com

# Check if server can reach GitHub
ping github.com
```

### **Step 5: Restart Services**

If you can access the server, restart critical services:

```bash
# Restart SSH service
systemctl restart ssh

# Restart Docker
systemctl restart docker

# Restart your application
cd /root/flipnosis-digitalocean/digitalocean-deploy
docker-compose down
docker-compose up -d
```

---

## 🚨 **Emergency Recovery Steps**

### **If Server is Completely Unreachable:**

#### **Option 1: Reboot from Digital Ocean Dashboard**
1. Go to your droplet in Digital Ocean
2. Click "Power" → "Power Off"
3. Wait 30 seconds
4. Click "Power" → "Power On"
5. Wait 2-3 minutes for full boot

#### **Option 2: Recreate Droplet**
If the server is corrupted or destroyed:

1. **Backup Important Data** (if possible)
2. **Create New Droplet:**
   - Ubuntu 22.04 LTS
   - 2GB RAM, 50GB SSD
   - Same region as before
   - SSH key authentication (recommended)

3. **Follow Setup Guide:**
   - Use `DIGITALOCEAN_SETUP_GUIDE.md`
   - Update GitHub secrets with new IP
   - Redeploy application

#### **Option 3: Contact Digital Ocean Support**
- If droplet is stuck or unresponsive
- If you can't access console
- If billing issues prevent access

---

## 🔧 **Quick Diagnostic Commands**

### **From Your Local Machine:**
```bash
# Test different connection methods
telnet 143.198.166.196 22
telnet 143.198.166.196 80
telnet 143.198.166.196 443

# Test with curl (if HTTP is working)
curl -I http://143.198.166.196
curl -I http://143.198.166.196/health
```

### **From Digital Ocean Console:**
```bash
# System status
uptime
free -h
df -h

# Service status
systemctl status ssh
systemctl status docker
systemctl status nginx

# Application status
docker ps
docker-compose ps
docker-compose logs
```

---

## 📞 **Next Steps**

1. **Check Digital Ocean Dashboard** - Verify droplet status
2. **Try Console Access** - Use Digital Ocean console to access server
3. **Update GitHub Secrets** - If IP changed, update `DIGITALOCEAN_HOST`
4. **Test Deployment** - Once server is accessible, test deployment
5. **Monitor Logs** - Check application logs for any issues

---

## 🔗 **Useful Links**

- **Digital Ocean Dashboard**: https://cloud.digitalocean.com/
- **Digital Ocean Documentation**: https://docs.digitalocean.com/
- **SSH Troubleshooting**: https://docs.digitalocean.com/products/droplets/how-to/add-ssh-keys/
- **Firewall Setup**: https://docs.digitalocean.com/products/networking/firewalls/
