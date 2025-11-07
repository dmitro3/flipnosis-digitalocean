# Open Direct IP Test Page (Bypasses Cloudflare)
# Use this to test changes immediately without cache issues

$gameId = "physics_1762531008408_aff908b5950b314b"
$wallet = "0xf51D1e69b6857De81432d0D628c45B27dbcE97B6"
$room = "potion"

$url = "http://159.69.242.154/test-tubes.html?gameId=$gameId&room=$room&wallet=$wallet"

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  OPENING DIRECT IP (NO CLOUDFLARE CACHE)" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "URL: $url`n" -ForegroundColor Green
Write-Host "⚠️  IMPORTANT: Make sure browser shows 159.69.242.154 in address bar!" -ForegroundColor Yellow
Write-Host "   NOT flipnosis.fun!`n" -ForegroundColor Yellow

# Open in default browser
Start-Process $url

Write-Host "✅ Browser opened!`n" -ForegroundColor Green
Write-Host "What to check:" -ForegroundColor White
Write-Host "  1. Address bar shows: 159.69.242.154" -ForegroundColor White
Write-Host "  2. Console shows: v777PINK in file names" -ForegroundColor White
Write-Host "  3. HUGE PINK BUTTON bottom-right saying 'MUTE'" -ForegroundColor White
Write-Host "`n"

