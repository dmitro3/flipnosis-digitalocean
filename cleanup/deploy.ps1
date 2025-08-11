# Flipnosis Clean Deployment Script
# This script builds locally and deploys to Digital Ocean with Git backup

param(
    [string]$Email = "",
    [switch]$SkipBackup = $false
)

Write-Host "🚀 Flipnosis Clean Deployment" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Configuration
$DROPLET_IP = "143.198.166.196"
$DOMAIN = "www.flipnosis.fun"
$BACKUP_BRANCH = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Get email if not provided
if (-not $Email) {
    $Email = Read-Host "Enter your email for SSL certificates"
    if (-not $Email) {
        Write-Host "Email is required for SSL certificates" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Using email: $Email" -ForegroundColor Yellow

# Step 1: Git Backup (unless skipped)
if (-not $SkipBackup) {
    Write-Host "`n📦 Step 1: Creating Git Backup" -ForegroundColor Blue
    
    # Check if we have changes to commit
    $status = git status --porcelain
    if ($status) {
        Write-Host "Committing current changes..." -ForegroundColor Yellow
        git add .
        git commit -m "Auto-backup before deployment - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
    
    # Create backup branch
    Write-Host "Creating backup branch: $BACKUP_BRANCH" -ForegroundColor Yellow
    git checkout -b $BACKUP_BRANCH
    git push origin $BACKUP_BRANCH
    
    # Return to main branch
    git checkout main
    
    Write-Host "✅ Git backup completed!" -ForegroundColor Green
} else {
    Write-Host "`n⏭️  Skipping Git backup" -ForegroundColor Yellow
}

# Step 2: Clean Build
Write-Host "`n🔨 Step 2: Building Application Locally" -ForegroundColor Blue

# Clean previous builds
if (Test-Path "dist") {
    Write-Host "Cleaning previous build..." -ForegroundColor Yellow
    Remove-Item "dist" -Recurse -Force
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Build the application
Write-Host "Building React application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green

# Step 3: Prepare Deployment Package
Write-Host "`n📦 Step 3: Preparing Deployment Package" -ForegroundColor Blue

# Create deployment directory
$deployDir = "deployment-package"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir -Force

# Copy necessary files
Write-Host "Copying built files..." -ForegroundColor Yellow
Copy-Item "dist" -Destination "$deployDir/" -Recurse -Force
Copy-Item "server" -Destination "$deployDir/" -Recurse -Force
Copy-Item "contracts" -Destination "$deployDir/" -Recurse -Force
Copy-Item "public" -Destination "$deployDir/" -Recurse -Force
Copy-Item "scripts" -Destination "$deployDir/" -Recurse -Force
Copy-Item "package.json" -Destination "$deployDir/" -Force
Copy-Item "package-lock.json" -Destination "$deployDir/" -Force

# Copy environment template
Copy-Item "env-template.txt" -Destination "$deployDir/" -Force

Write-Host "✅ Deployment package prepared!" -ForegroundColor Green

# Step 4: Deploy to Server
Write-Host "`n🚀 Step 4: Deploying to Digital Ocean" -ForegroundColor Blue

# Create deployment script for server
$deployScript = @'
#!/bin/bash
set -e

echo "Starting deployment..."

# Navigate to project directory
cd /root/flipnosis-digitalocean

# Create backup of current deployment
if [ -d "current-deployment" ]; then
    mv current-deployment backup-$(date +%Y%m%d-%H%M%S)
fi

# Extract new deployment
tar -xzf deployment.tar.gz
mv deployment-package current-deployment

# Navigate to deployment directory
cd current-deployment

# Set up environment
cp env-template.txt .env

# Install production dependencies
npm install --production

# Set up SSL if needed
if [ ! -f /etc/nginx/ssl/cert.pem ]; then
    echo "Setting up SSL certificates..."
    chmod +x scripts/setup-ssl.sh
    ./scripts/setup-ssl.sh $DOMAIN $Email
fi

# Restart services
echo "Restarting services..."
systemctl restart nginx
systemctl restart flipnosis-app

echo "Deployment completed!"
echo "Your site should be available at: https://$DOMAIN"
'@

# Save deployment script
$deployScript | Out-File -FilePath "$deployDir/deploy.sh" -Encoding ASCII -NoNewline

# Create tar.gz package
Write-Host "Creating deployment archive..." -ForegroundColor Yellow
tar -czf "$deployDir.tar.gz" -C $deployDir .

# Upload to server
Write-Host "Uploading to server..." -ForegroundColor Yellow
scp "$deployDir.tar.gz" root@${DROPLET_IP}:/root/flipnosis-digitalocean/

# Execute deployment on server
Write-Host "Executing deployment..." -ForegroundColor Yellow
ssh root@$DROPLET_IP "cd /root/flipnosis-digitalocean; tar -xzf $deployDir.tar.gz; chmod +x deployment-package/deploy.sh; ./deployment-package/deploy.sh"

# Clean up local files
Remove-Item $deployDir -Recurse -Force
Remove-Item "$deployDir.tar.gz" -Force

Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "Your site should be available at: https://$DOMAIN" -ForegroundColor Cyan
Write-Host "Git backup created: $BACKUP_BRANCH" -ForegroundColor Yellow

# Optional: Clean up old backup branches (keep last 5)
if (-not $SkipBackup) {
    Write-Host "`n🧹 Cleaning up old backup branches..." -ForegroundColor Blue
    $backupBranches = git branch -r | Where-Object { $_ -like "*backup-*" } | Sort-Object -Descending
    if ($backupBranches.Count -gt 5) {
        $branchesToDelete = $backupBranches | Select-Object -Skip 5
        foreach ($branch in $branchesToDelete) {
            $branchName = $branch.Trim()
            Write-Host "Deleting old backup: $branchName" -ForegroundColor Yellow
            git push origin --delete $branchName
        }
    }
}
