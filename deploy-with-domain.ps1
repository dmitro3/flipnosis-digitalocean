# Deploy Flipnosis with Domain Setup
# This script deploys your app and sets up SSL for www.flipnosis.fun

Write-Host "Deploying Flipnosis with Domain Setup" -ForegroundColor Green

# Configuration
$DROPLET_IP = "143.198.166.196"
$DOMAIN = "www.flipnosis.fun"
$EMAIL = Read-Host "Enter your email for SSL certificates"

if (-not $EMAIL) {
    Write-Host "Email is required for SSL certificates" -ForegroundColor Red
    exit 1
}

Write-Host "Using email: $EMAIL" -ForegroundColor Yellow

# SSH into droplet and deploy
Write-Host "Connecting to DigitalOcean droplet..." -ForegroundColor Blue

# Create a temporary script file with proper Unix line endings
$deployScript = @"
#!/bin/bash
set -e

echo "Starting deployment..."

# Navigate to project directory
cd /root/flipnosis-digitalocean

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Navigate to deployment directory
cd digitalocean-deploy

# Make SSL script executable
chmod +x scripts/setup-ssl.sh

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Build containers
echo "Building containers..."
docker-compose build --no-cache

# Start containers
echo "Starting containers..."
docker-compose up -d

# Wait for app to be ready
echo "Waiting for app to be ready..."
sleep 10

# Run database migration
echo "Running database migration..."
docker-compose exec -T app node scripts/migrate-database-schema.js || true

# Check if SSL certificates exist
if [ ! -f /etc/nginx/ssl/cert.pem ]; then
    echo "Setting up SSL certificates..."
    ./scripts/setup-ssl.sh $DOMAIN $EMAIL
else
    echo "SSL certificates already exist"
fi

echo "Deployment completed!"
echo "Your site should be available at: https://$DOMAIN"
"@

# Save the script to a temporary file
$tempScript = "deploy-temp.sh"
$deployScript | Out-File -FilePath $tempScript -Encoding ASCII -NoNewline

# Copy the script to the server and execute it
Write-Host "Copying deployment script to server..." -ForegroundColor Blue
scp $tempScript root@${DROPLET_IP}:/tmp/deploy-temp.sh

Write-Host "Executing deployment script..." -ForegroundColor Blue
ssh root@$DROPLET_IP "chmod +x /tmp/deploy-temp.sh && /tmp/deploy-temp.sh"

# Clean up
Remove-Item $tempScript -ErrorAction SilentlyContinue
ssh root@$DROPLET_IP "rm -f /tmp/deploy-temp.sh"

Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Your site should be available at: https://$DOMAIN" -ForegroundColor Cyan
Write-Host "DNS is configured correctly - your domain should work!" -ForegroundColor Yellow
