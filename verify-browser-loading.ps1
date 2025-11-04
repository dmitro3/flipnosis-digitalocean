# Script to help user verify they're loading from server
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  VERIFY YOU'RE LOADING FROM SERVER (NOT LOCAL)" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. What URL are you using?" -ForegroundColor White
Write-Host "   ✅ CORRECT: https://www.flipnosis.fun/test-tubes.html?gameId=..." -ForegroundColor Green
Write-Host "   ❌ WRONG:   http://localhost:5173/..." -ForegroundColor Red
Write-Host "   ❌ WRONG:   file:///C:/Users/..." -ForegroundColor Red
Write-Host ""
Write-Host "2. Open Browser DevTools (F12)" -ForegroundColor White
Write-Host "   → Go to Network tab" -ForegroundColor Gray
Write-Host "   → Refresh the page" -ForegroundColor Gray
Write-Host "   → Find 'game-main.js' in the list" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Check the 'Name' column for game-main.js:" -ForegroundColor White
Write-Host "   ✅ Should show: flipnosis.fun/js/game-main.js" -ForegroundColor Green
Write-Host "   ❌ Wrong if shows: localhost or file://" -ForegroundColor Red
Write-Host ""
Write-Host "4. Click on game-main.js and check:" -ForegroundColor White
Write-Host "   → Headers tab → Request URL" -ForegroundColor Gray
Write-Host "   → Should be: https://www.flipnosis.fun/js/game-main.js" -ForegroundColor Green
Write-Host ""
Write-Host "5. Check Response tab:" -ForegroundColor White
Write-Host "   → Search for 'unified handler'" -ForegroundColor Gray
Write-Host "   → Should find: 'unified handler for both mobile and desktop'" -ForegroundColor Green
Write-Host "   → Search for 'change-coin-box'" -ForegroundColor Gray
Write-Host "   → Should NOT find it (means old code is gone)" -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

