# Deploy Socket.io Fixes to Hetzner Server (PowerShell)
# Usage: .\deploy-socket-fixes.ps1 -Server "user@159.69.xxx.xxx" -Path "/var/www/flipnosis"

param(
    [Parameter(Mandatory=$true)]
    [string]$Server,
    
    [Parameter(Mandatory=$true)]
    [string]$Path
)

Write-Host "🚀 Deploying Socket.io fixes to $Server..." -ForegroundColor Cyan
Write-Host "📁 Remote path: $Path" -ForegroundColor Gray
Write-Host ""

# Create backup on remote server
Write-Host "📦 Creating backup..." -ForegroundColor Yellow
ssh $Server "cd $Path && cp -r public public.backup.`$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"
Write-Host "✅ Backup created" -ForegroundColor Green
Write-Host ""

# Upload modified files
Write-Host "📤 Uploading files..." -ForegroundColor Yellow

scp public/test-tubes.html "${Server}:${Path}/public/"
Write-Host "  ✅ test-tubes.html" -ForegroundColor Green

scp public/js/core/socket-manager.js "${Server}:${Path}/public/js/core/"
Write-Host "  ✅ socket-manager.js" -ForegroundColor Green

scp public/js/game-main.js "${Server}:${Path}/public/js/"
Write-Host "  ✅ game-main.js" -ForegroundColor Green

scp public/js/core/update-client-state.js "${Server}:${Path}/public/js/core/"
Write-Host "  ✅ update-client-state.js" -ForegroundColor Green

Write-Host ""
Write-Host "✅ All files uploaded!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Next steps:" -ForegroundColor Yellow
Write-Host "   1. SSH to your server: ssh $Server"
Write-Host "   2. Navigate to: cd $Path"
Write-Host "   3. Restart your server if needed (PM2, systemd, etc.)"
Write-Host "   4. Test at: https://flipnosis.fun/test-tubes.html"
Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green

