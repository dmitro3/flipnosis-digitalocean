# Simple GitHub Push Script
Write-Host "📤 Pushing to GitHub for backup..." -ForegroundColor Green

# Add all changes
Write-Host "Adding files to Git..." -ForegroundColor Yellow
git add .

# Commit with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "Backup: $timestamp - Server-side game engine updates"
Write-Host "Committing with message: $commitMessage" -ForegroundColor Yellow
git commit -m $commitMessage

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
Write-Host "🔗 Check your repository at: https://github.com/AlphaSocial/flipnosis-digitalocean" -ForegroundColor Yellow
Write-Host "" -ForegroundColor White
Write-Host "To deploy to DigitalOcean, run: .\deploy.ps1" -ForegroundColor Cyan
