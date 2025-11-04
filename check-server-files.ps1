# Quick script to verify server files
Write-Host "🔍 Checking server files..." -ForegroundColor Cyan
Write-Host ""

ssh root@159.69.242.154 @"
cd /opt/flipnosis/app
echo '=== FILE CHECK ==='
echo 'game-main.js:'
ls -lah public/js/game-main.js
echo ''
echo 'Checking for old code:'
grep -c 'change-coin-box' public/js/game-main.js && echo '  ❌ OLD CODE FOUND!' || echo '  ✅ No old code'
grep -c 'unified handler' public/js/game-main.js && echo '  ✅ NEW CODE FOUND!' || echo '  ❌ New code missing'
echo ''
echo 'test-tubes.html:'
ls -lah public/test-tubes.html
grep -c 'v=10' public/test-tubes.html && echo '  ✅ Cache version updated!' || echo '  ⚠️ Cache version not updated'
"@

Write-Host ""
Write-Host "✅ Check complete!" -ForegroundColor Green

