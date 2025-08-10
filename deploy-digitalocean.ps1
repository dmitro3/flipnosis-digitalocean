# DigitalOcean Deployment Script for Flipnosis
# This script will help you deploy the application to your DigitalOcean droplet

Write-Host "🚀 Flipnosis DigitalOcean Deployment Script" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Step 1: Check if you have SSH access to the droplet
Write-Host "`n📋 Step 1: SSH Access Check" -ForegroundColor Yellow
Write-Host "You need to SSH into your DigitalOcean droplet at: 143.198.166.196" -ForegroundColor White
Write-Host "Use the following command:" -ForegroundColor Cyan
Write-Host "ssh root@143.198.166.196" -ForegroundColor White

# Step 2: Environment Setup Instructions
Write-Host "`n📋 Step 2: Environment Setup" -ForegroundColor Yellow
Write-Host "On the droplet, you need to:" -ForegroundColor White
Write-Host "1. Clone your repository" -ForegroundColor White
Write-Host "2. Set up environment variables" -ForegroundColor White
Write-Host "3. Deploy with Docker Compose" -ForegroundColor White

# Step 3: Commands to run on the droplet
Write-Host "`n📋 Step 3: Commands to run on the droplet" -ForegroundColor Yellow
Write-Host "Run these commands on your DigitalOcean droplet:" -ForegroundColor White

Write-Host "`n# 1. Navigate to home directory and clone repo" -ForegroundColor Cyan
Write-Host "cd /root" -ForegroundColor White
Write-Host "git clone https://github.com/your-username/your-repo.git flipnosis-digitalocean" -ForegroundColor White
Write-Host "cd flipnosis-digitalocean" -ForegroundColor White

Write-Host "`n# 2. Set up environment variables" -ForegroundColor Cyan
Write-Host "cp env-template.txt .env" -ForegroundColor White
Write-Host "# Edit .env file with your actual values:" -ForegroundColor White
Write-Host "nano .env" -ForegroundColor White

Write-Host "`n# 3. Navigate to deployment directory" -ForegroundColor Cyan
Write-Host "cd digitalocean-deploy" -ForegroundColor White

Write-Host "`n# 4. Make deployment script executable" -ForegroundColor Cyan
Write-Host "chmod +x scripts/deploy.sh" -ForegroundColor White

Write-Host "`n# 5. Run deployment" -ForegroundColor Cyan
Write-Host "./scripts/deploy.sh" -ForegroundColor White

Write-Host "`n# 6. Check if containers are running" -ForegroundColor Cyan
Write-Host "docker-compose ps" -ForegroundColor White

Write-Host "`n# 7. Check logs if there are issues" -ForegroundColor Cyan
Write-Host "docker-compose logs app" -ForegroundColor White
Write-Host "docker-compose logs nginx" -ForegroundColor White

# Step 4: Environment Variables Template
Write-Host "`n📋 Step 4: Required Environment Variables" -ForegroundColor Yellow
Write-Host "Make sure your .env file contains these variables:" -ForegroundColor White

$envTemplate = @"
# Database Configuration
DATABASE_URL=sqlite:/app/server/flipz-clean.db

# Blockchain Configuration
CONTRACT_ADDRESS=0x3997F4720B3a515e82d54F30d7CF2993B014EeBE
CONTRACT_OWNER_KEY=your_private_key_here
RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_alchemy_key

# Application Configuration
PORT=3000
NODE_ENV=production

# Optional: SSL Configuration
ENABLE_SSL=false
"@

Write-Host $envTemplate -ForegroundColor Gray

# Step 5: Troubleshooting Commands
Write-Host "`n📋 Step 5: Troubleshooting Commands" -ForegroundColor Yellow
Write-Host "If the deployment fails, use these commands:" -ForegroundColor White

Write-Host "`n# Check if Docker is running" -ForegroundColor Cyan
Write-Host "systemctl status docker" -ForegroundColor White

Write-Host "`n# Check if ports are available" -ForegroundColor Cyan
Write-Host "netstat -tlnp | grep :80" -ForegroundColor White
Write-Host "netstat -tlnp | grep :443" -ForegroundColor White

Write-Host "`n# Check disk space" -ForegroundColor Cyan
Write-Host "df -h" -ForegroundColor White

Write-Host "`n# Check memory usage" -ForegroundColor Cyan
Write-Host "free -h" -ForegroundColor White

Write-Host "`n# Restart containers" -ForegroundColor Cyan
Write-Host "docker-compose down" -ForegroundColor White
Write-Host "docker-compose up -d" -ForegroundColor White

# Step 6: Verification
Write-Host "`n📋 Step 6: Verification" -ForegroundColor Yellow
Write-Host "After deployment, test these URLs:" -ForegroundColor White
Write-Host "http://143.198.166.196" -ForegroundColor Cyan
Write-Host "http://143.198.166.196/health" -ForegroundColor Cyan
Write-Host "https://www.flipnosis.fun" -ForegroundColor Cyan

Write-Host "`n🎉 Deployment Instructions Complete!" -ForegroundColor Green
Write-Host "Follow the steps above to deploy your application to DigitalOcean." -ForegroundColor White
