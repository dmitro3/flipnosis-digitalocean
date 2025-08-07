# 🚀 DigitalOcean Migration - Next Steps Guide

## Current Status ✅
You've completed the preparation phase! All deployment files are ready:
- ✅ Docker Compose configuration
- ✅ Dockerfile with multi-stage build
- ✅ Nginx reverse proxy setup
- ✅ Deployment scripts
- ✅ GitHub Actions workflow (just created)

## 🎯 Your Preferred Workflow Setup

You want to continue making changes here and pushing to git for automatic deployment. Here's how we'll set this up:

### Step 1: Set Up GitHub Secrets (5 minutes)

You need to add these secrets to your GitHub repository:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:

```
DIGITALOCEAN_HOST=your-droplet-ip
DIGITALOCEAN_USERNAME=root
DIGITALOCEAN_SSH_KEY=your-private-ssh-key
DIGITALOCEAN_PORT=22
VITE_CONTRACT_ADDRESS=your-contract-address
VITE_ALCHEMY_API_KEY=your-alchemy-key
VITE_CHAIN_ID=8453
```

### Step 2: Initial Server Setup (10 minutes)

SSH into your DigitalOcean droplet and run:

```bash
# Clone your repository
git clone https://github.com/yourusername/flipnosis.git
cd flipnosis

# Copy environment template
cp digitalocean-deploy/env-template.txt digitalocean-deploy/.env

# Edit the .env file with your actual values
nano digitalocean-deploy/.env
```

### Step 3: First Deployment (5 minutes)

After setting up the secrets and server, simply push to main:

```bash
git add .
git commit -m "Initial DigitalOcean deployment"
git push origin main
```

The GitHub Actions workflow will automatically:
1. Build your application
2. Deploy to DigitalOcean
3. Start all services

## 🔄 Your New Workflow

From now on, your workflow is:

1. **Make changes here** (just like before)
2. **Commit and push** to git
3. **GitHub Actions automatically deploys** to DigitalOcean
4. **Your app updates** within 2-3 minutes

## 📋 What You Need to Do Right Now

### Option A: Quick Setup (Recommended)
1. Add the GitHub secrets (Step 1 above)
2. SSH to your droplet and clone the repo (Step 2)
3. Push a test commit to trigger deployment

### Option B: Manual First Deployment
If you prefer to test manually first:
1. SSH to your droplet
2. Clone the repo
3. Run the deployment script manually
4. Then set up GitHub Actions for future deployments

## 🔧 Environment Variables You Need

Copy these from your Railway setup to your DigitalOcean `.env` file:

```bash
DATABASE_URL=your-digitalocean-postgres-url
CONTRACT_ADDRESS=your-contract-address
CONTRACT_OWNER_KEY=your-private-key
RPC_URL=your-alchemy-rpc-url
```

## 🚨 Important Notes

1. **Database Migration**: Your Railway database will need to be exported and imported to DigitalOcean PostgreSQL
2. **SSL Certificates**: The setup includes SSL support - you'll need to add certificates to `nginx/ssl/`
3. **Domain**: Update your domain DNS to point to your DigitalOcean droplet IP

## 🆘 Need Help?

If you get stuck at any step:
1. Check the logs: `docker-compose logs -f`
2. SSH into the droplet and run the deployment script manually
3. The GitHub Actions workflow will show detailed logs if deployment fails

## 🎉 Success Criteria

You'll know it's working when:
- ✅ GitHub Actions workflow runs successfully
- ✅ Your app is accessible at your droplet IP
- ✅ Database connection works
- ✅ Coin flip functionality works

Ready to proceed? Let me know which option you prefer (A or B) and I'll guide you through the specific steps!
