# Check what code is actually live on the server
$ErrorActionPreference = "Stop"

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  CHECKING LIVE SERVER STATUS" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "1. PM2 Status:" -ForegroundColor Yellow
ssh root@159.69.242.154 "pm2 status | grep flipnosis"

Write-Host "`n2. Latest Build Time:" -ForegroundColor Yellow
ssh root@159.69.242.154 "stat -c '%y' /opt/flipnosis/app/dist/index.html"

Write-Host "`n3. Latest Bundle Hash:" -ForegroundColor Yellow
ssh root@159.69.242.154 "grep 'index-.*js' /opt/flipnosis/app/dist/index.html"

Write-Host "`n4. Socket Manager Version:" -ForegroundColor Yellow
$socketCheck = ssh root@159.69.242.154 "grep -c 'Skipping physics_join' /opt/flipnosis/app/dist/js/core/socket-manager.js"
if ($socketCheck -gt 0) {
    Write-Host "   OK: Has fixed socket code (skips physics_join)" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Still has old socket code!" -ForegroundColor Red
}

Write-Host "`n5. Test URLs:" -ForegroundColor Yellow
Write-Host "   Direct IP (no cache): http://159.69.242.154/" -ForegroundColor White
Write-Host "   Via Cloudflare:       https://www.flipnosis.fun/" -ForegroundColor White

Write-Host "`n6. Recent Server Logs:" -ForegroundColor Yellow
ssh root@159.69.242.154 "pm2 logs --lines 10 --nostream 2>&1 | tail -15"

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  CHECK COMPLETE" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan


