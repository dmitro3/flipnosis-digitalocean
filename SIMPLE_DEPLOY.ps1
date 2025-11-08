# ============================================
# SIMPLE RELIABLE DEPLOYMENT
# This bypasses ALL cache issues by:
# 1. Building locally
# 2. Pushing code
# 3. Deleting browser cache on server (purge)
# ============================================

param(
    [string]$CommitMessage = "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

Write-Host "`n==============" -ForegroundColor Cyan
Write-Host " SIMPLE DEPLOY" -ForegroundColor Cyan  
Write-Host "==============`n" -ForegroundColor Cyan

# Build locally
Write-Host "Building..." -ForegroundColor Yellow
npm run build

# Commit
Write-Host "Committing..." -ForegroundColor Yellow
git add -A
git commit -m $CommitMessage

# Push
Write-Host "Pushing to server..." -ForegroundColor Yellow
git push hetzner HEAD:refs/heads/main

Write-Host "`n✅ DEPLOYED!" -ForegroundColor Green
Write-Host "`n⚠️  IMPORTANT: Clear your browser cache!" -ForegroundColor Yellow
Write-Host "   Chrome: Ctrl+Shift+Delete -> Clear browsing data`n" -ForegroundColor Gray

# Purge Cloudflare
$zone = "YOUR_CLOUDFLARE_ZONE_ID"
$key = "YOUR_CLOUDFLARE_API_KEY"

if ($zone -ne "YOUR_CLOUDFLARE_ZONE_ID") {
    Write-Host "Purging Cloudflare cache..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $key"
        "Content-Type" = "application/json"
    }
    $body = @{ purge_everything = $true } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zone/purge_cache" `
            -Method Post -Headers $headers -Body $body
        Write-Host "✅ Cloudflare cache purged" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Cloudflare purge failed (manual purge may be needed)" -ForegroundColor Yellow
    }
}

Write-Host "`n🎮 Test at: https://flipnosis.fun/test-tubes.html`n" -ForegroundColor Cyan


