# Quick deploy to Hetzner - Rebuild and Restart
$ErrorActionPreference = "Stop"

Write-Host "Deploying to Hetzner..." -ForegroundColor Cyan
Write-Host ""

# SSH and run commands
ssh root@159.69.242.154 @"
cd /opt/flipnosis/app
echo 'Stopping PM2...'
pm2 stop all
echo 'Building application...'
npm run build
echo 'Restarting PM2...'
pm2 restart all
pm2 save
echo 'Done!'
ls -lh dist/assets/index-*.js | tail -3
"@

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Now hard refresh your browser (Ctrl + Shift + R)" -ForegroundColor Yellow





