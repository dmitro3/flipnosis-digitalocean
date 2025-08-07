# 🚀 Complete DigitalOcean Setup Guide - Your Specific Details

## ✅ Your DigitalOcean Details
- **Droplet IP**: `143.198.166.196`
- **Username**: `root`
- **Database Host**: `flipnosisdatabase-do-user-24486451-0.g.db.ondigitalocean.com`
- **Database Port**: `25060`
- **Database Name**: `defaultdb`
- **Database User**: `doadmin`
- **Database Password**: `AVNS_JYhgy_V8gsRtLqpNLxt`

## 🔑 SSH Keys Generated
Your SSH keys have been generated and are ready to use:
- **Private Key**: `C:\Users\danie\.ssh\digitalocean_key`
- **Public Key**: `C:\Users\danie\.ssh\digitalocean_key.pub`

## 📋 Step-by-Step Setup

### Step 1: Add GitHub Secrets (5 minutes)

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add these secrets:

```
DIGITALOCEAN_HOST=143.198.166.196
DIGITALOCEAN_USERNAME=root
DIGITALOCEAN_SSH_KEY=[Copy the entire private key content below]
DIGITALOCEAN_PORT=22
VITE_CONTRACT_ADDRESS=0x3997F4720B3a515e82d54F30d7CF2993B014EeBE
VITE_ALCHEMY_API_KEY=hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3
VITE_CHAIN_ID=8453
```

**Private Key Content for DIGITALOCEAN_SSH_KEY:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAACFwAAAAdzc2gtcn
NhAAAAAwEAAQAAAgEA+aRuIm1tXLyZyWUFYYiu+yPhSWuuQY0f7za9h3WMBA+AWcKtiGm3
X8GENvFl7CFE88nBnFPwvzOPwVMTh3IPD/TABLAbBY86ANg31nnWWZwG6V8T9pz4sgt9bj
Vsa+23i9uQqJgYFuHZhVLmzHX6IZWdhch62j1Sh7mQPdSE326tLXo+gs6L7zw17xoq9wfj
jN3kctvlmIpMqRxsv1CfekcjlUJtkxR1BTNK1/zPfUtyI3Z6HJrKgy4PzyqKX7apHRyYlh
U73S5qZ/RyEZ/KL7/eGsbreE3s1HfPyOM+KN7NldZHc8jCTjuou5f7bYaA5xMwEJ/YW2Qi
bhgCRRmHnIaUYMqiJX3BD0Y0LDZzRQwQI79YyqMseZgEhJWNuxESyuWuJLtt8m+PDy6SCz
5nlhxtcvJsCxP5W4KSki4B+3uRePxgRggW4K/EOebNYmTBmAlFu3jDNC/Sb49Fv4BmDv8I
kYSppDF8bSZn1bf/91uyiGeKFrIf514xlPeQHce+5rF/yhk6HKKOdQJKr4xFHXrpK7o9FM
EFrZ1wBDJJcOHW4GXUe8dO7ymQvOuu4llFPmkFplRCsx4czQ0azdj6szM0qP0DuXp4yMjt
M7Y9JksBM261orv474ZgV940Z+qMNvIs1FYWdl7rFN19TMdlXhh3D7DP4Bro7FXBg36wLq
kAAAdQyK6ztMius7QAAAAHc3NoLXJzYQAAAgEA+aRuIm1tXLyZyWUFYYiu+yPhSWuuQY0f
7za9h3WMBA+AWcKtiGm3X8GENvFl7CFE88nBnFPwvzOPwVMTh3IPD/TABLAbBY86ANg31n
nWWZwG6V8T9pz4sgt9bjVsa+23i9uQqJgYFuHZhVLmzHX6IZWdhch62j1Sh7mQPdSE326t
LXo+gs6L7zw17xoq9wfjjN3kctvlmIpMqRxsv1CfekcjlUJtkxR1BTNK1/zPfUtyI3Z6HJ
rKgy4PzyqKX7apHRyYlhU73S5qZ/RyEZ/KL7/eGsbreE3s1HfPyOM+KN7NldZHc8jCTjuo
u5f7bYaA5xMwEJ/YW2QibhgCRRmHnIaUYMqiJX3BD0Y0LDZzRQwQI79YyqMseZgEhJWNux
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
-----END OPENSSH PRIVATE KEY-----
```

### Step 2: Add SSH Key to DigitalOcean Droplet (5 minutes)

SSH into your DigitalOcean droplet and add the public key:

```bash
# SSH to your droplet
ssh root@143.198.166.196

# Add the public key to authorized_keys
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQD5pG4ibW1cvJnJZQVhiK77I+FJa65BjR/vNr2HdYwED4BZwq2IabdfwYQ28WXsIUTzycGcU/C/M4/BUxOHcg8P9MAEsBsFjzoA2DfWedZZnAbpXxP2nPiyC31uNWxr7beL25ComBgW4dmFUubMdfohlZ2FyHraPVKHuZA91ITfbq0tej6CzovvPDXvGir3B+OM3eRy2+WYikypHGy/UJ96RyOVQm2TFHUFM0rX/M99S3IjdnocmsqDLg/PKopftqkdHJiWFTvdLmpn9HIRn8ovv94axut4TezUd8/I4z4o3s2V1kdzyMJOO6i7l/tthoDnEzAQn9hbZCJuGAJFGYechpRgyqIlfcEPRjQsNnNFDBAjv1jKoyx5mASElY27ERLK5a4ku23yb48PLpILPmeWHG1y8mwLE/lbgpKSLgH7e5F4/GBGCBbgr8Q55s1iZMGYCUW7eMM0L9Jvj0W/gGYO/wiRhKmkMXxtJmfVt//3W7KIZ4oWsh/nXjGU95Adx77msX/KGTocoo51AkqvjEUdeukruj0UwQWtnXAEMklw4dbgZdR7x07vKZC8667iWUU+aQWmVEKzHhzNDRrN2PqzMzSo/QO5enjIyO0ztj0mSwEzbrWiu/jvhmBX3jRn6ow28izUVhZ2XusU3X1Mx2VeGHcPsM/gGujsVcGDfrAuq" >> ~/.ssh/authorized_keys

# Clone your repository
git clone https://github.com/yourusername/flipnosis.git
cd flipnosis

# Copy environment template
cp digitalocean-deploy/env-template.txt digitalocean-deploy/.env
```

### Step 3: Configure Environment Variables (5 minutes)

Edit the `.env` file on your DigitalOcean droplet:

```bash
nano digitalocean-deploy/.env
```

Replace the content with:

```bash
# Database Configuration
DATABASE_URL=postgresql://doadmin:AVNS_JYhgy_V8gsRtLqpNLxt@flipnosisdatabase-do-user-24486451-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require

# Contract Configuration
CONTRACT_ADDRESS=0x3997F4720B3a515e82d54F30d7CF2993B014EeBE
CONTRACT_OWNER_KEY=f19dd56173918d384a2ff2d73905ebc666034b6abd34312a074b4a80ddb2e80c

# Platform Fee Receiver
PLATFORM_FEE_RECEIVER=0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28

# RPC Configuration
RPC_URL=https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3

# Environment
NODE_ENV=production
PORT=3000

# SSL Configuration (optional)
ENABLE_SSL=false
```

### Step 4: First Deployment (5 minutes)

Now push a test commit to trigger the GitHub Actions deployment:

```bash
# From your local machine
git add .
git commit -m "Initial DigitalOcean deployment setup"
git push origin main
```

## 🔄 Your New Workflow

After this setup, your workflow will be:

1. **Make changes here** (just like before)
2. **Commit and push** to git
3. **GitHub Actions automatically deploys** to DigitalOcean
4. **Your app updates** within 2-3 minutes

## 🗄️ Database Migration

Your Railway database needs to be migrated. Run this script locally:

```bash
# Run the migration script
./scripts/migrate-database.sh
```

When prompted:
- **Railway Database URL**: Get this from your Railway dashboard
- **DigitalOcean Database URL**: `postgresql://doadmin:AVNS_JYhgy_V8gsRtLqpNLxt@flipnosisdatabase-do-user-24486451-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require`

## 🎉 Success Criteria

You'll know it's working when:
- ✅ GitHub Actions workflow runs successfully
- ✅ Your app is accessible at `http://143.198.166.196`
- ✅ Database connection works
- ✅ Coin flip functionality works

## 🆘 Troubleshooting

If you encounter issues:

1. **Check GitHub Actions logs** for deployment errors
2. **SSH into droplet**: `ssh root@143.198.166.196`
3. **Check container logs**: `docker-compose logs -f`
4. **Test database connection**: `psql "postgresql://doadmin:AVNS_JYhgy_V8gsRtLqpNLxt@flipnosisdatabase-do-user-24486451-0.g.db.ondigitalocean.com:25060/defaultdb?sslmode=require"`

Ready to proceed? Let me know when you've completed each step!
