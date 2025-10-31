# Quick deploy for coin flip fixes - Windows PowerShell version
# Run this from PowerShell in your project directory

Write-Host "🚀 DEPLOYING COIN FLIP FIXES TO HETZNER" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Copy to dist folder first
Write-Host "📋 Preparing files..." -ForegroundColor Yellow
Copy-Item "public\test-tubes.html" "dist\test-tubes.html" -Force
Write-Host "   ✅ Copied test-tubes.html to dist/" -ForegroundColor Green

Write-Host ""
Write-Host "📦 Committing changes..." -ForegroundColor Yellow
git add public/test-tubes.html
git add dist/test-tubes.html
git add server/PhysicsGameManager.js
git commit -m "🔧 Fix coin flip: smooth landing, simultaneous flips, asset preloading"
if ($LASTEXITCODE -ne 0) {
    Write-Host "   (Already committed or no changes)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "📡 Connecting to Hetzner (159.69.242.154)..." -ForegroundColor Yellow
Write-Host ""

# Deploy to server
ssh root@159.69.242.154 @"
cd /root/Flipnosis-Battle-Royale-current || cd ~/Flipnosis-Battle-Royale-current || cd /var/www/flipnosis || exit 1

echo '📥 Pulling latest code...'
git pull origin main

echo ''
echo '🔄 Restarting PM2...'
pm2 restart all

echo ''
echo '📋 Server logs (last 30 lines):'
pm2 logs --lines 30 --nostream

echo ''
echo '✅ Deployment complete!'
"@

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ COIN FLIP FIXES DEPLOYED!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 Test these NOW:" -ForegroundColor Yellow
Write-Host "   1. Hard refresh browser (Ctrl+Shift+R)" -ForegroundColor Gray
Write-Host "   2. Start a new game" -ForegroundColor Gray
Write-Host "   3. Both players flip at same time" -ForegroundColor Gray
Write-Host "   4. Watch for smooth coin landing" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Expected: No errors, smooth animations" -ForegroundColor Green
Write-Host "❌ If issues persist, check server logs with:" -ForegroundColor Red
Write-Host "   ssh root@159.69.242.154 'pm2 logs'" -ForegroundColor Gray
Write-Host ""

