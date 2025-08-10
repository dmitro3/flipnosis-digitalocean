# Simple Digital Ocean Deployment Script
Write-Host "🚀 Starting simple Digital Ocean deployment..." -ForegroundColor Green

# Build the application locally
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build:production

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green

# Copy files to deployment directory
Write-Host "📁 Copying files to deployment directory..." -ForegroundColor Yellow
if (Test-Path "digitalocean-deploy") {
    Remove-Item "digitalocean-deploy" -Recurse -Force
}
New-Item -ItemType Directory -Path "digitalocean-deploy" -Force

# Copy necessary files
Copy-Item "dist" -Destination "digitalocean-deploy/" -Recurse -Force
Copy-Item "server" -Destination "digitalocean-deploy/" -Recurse -Force
Copy-Item "contracts" -Destination "digitalocean-deploy/" -Recurse -Force
Copy-Item "public" -Destination "digitalocean-deploy/" -Recurse -Force
Copy-Item "scripts" -Destination "digitalocean-deploy/" -Recurse -Force
Copy-Item "package*.json" -Destination "digitalocean-deploy/" -Force
Copy-Item "env-template.txt" -Destination "digitalocean-deploy/" -Force

Write-Host "✅ Files copied successfully!" -ForegroundColor Green

# Instructions for manual deployment
Write-Host "📋 Manual Deployment Instructions:" -ForegroundColor Cyan
Write-Host "1. Upload the 'digitalocean-deploy' folder to your Digital Ocean server" -ForegroundColor White
Write-Host "2. SSH into your server and navigate to the digitalocean-deploy directory" -ForegroundColor White
Write-Host "3. Run: docker-compose down" -ForegroundColor White
Write-Host "4. Run: docker-compose build --no-cache" -ForegroundColor White
Write-Host "5. Run: docker-compose up -d" -ForegroundColor White
Write-Host "6. Your app will be available at your server IP" -ForegroundColor White

Write-Host "🎉 Deployment package ready!" -ForegroundColor Green
