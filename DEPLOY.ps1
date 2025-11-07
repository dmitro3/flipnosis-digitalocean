# ============================================
# COMPLETE DEPLOYMENT SCRIPT FOR FLIPNOSIS
# ============================================
# This script does EVERYTHING needed for a successful deploy:
# 1. Commits your changes
# 2. Pushes to Hetzner  
# 3. Rebuilds on server
# 4. Restarts PM2
# 5. Purges Cloudflare cache
# 6. Verifies deployment
#
# USAGE: .\DEPLOY.ps1 "Your commit message"
# ============================================

param(
    [string]$CommitMessage = "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')",
    [switch]$SkipCloudflare
)

$ErrorActionPreference = "Stop"

# ============================================
# COLORS AND HELPERS
# ============================================
function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Success($msg) { Write-Host "    OK: $msg" -ForegroundColor Green }
function Write-Warning($msg) { Write-Host "    WARNING: $msg" -ForegroundColor Yellow }
function Write-Error($msg) { Write-Host "    ERROR: $msg" -ForegroundColor Red }

Write-Host "`n" -NoNewline
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  FLIPNOSIS DEPLOYMENT SYSTEM" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta

# ============================================
# STEP 1: BUILD LOCALLY
# ============================================
Write-Step "Building locally first..."
try {
    npm run build | Out-Null
    Write-Success "Local build complete"
} catch {
    Write-Error "Local build failed: $_"
    exit 1
}

# ============================================
# STEP 2: COMMIT CHANGES
# ============================================
Write-Step "Committing changes..."
git add -A

$status = git status --porcelain
if ($status) {
    Write-Host "    Changes to commit:" -ForegroundColor Gray
    $status | Select-Object -First 10 | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
    if ($status.Count -gt 10) {
        Write-Host "      ... and $($status.Count - 10) more files" -ForegroundColor Gray
    }
    
    git commit -m $CommitMessage
    Write-Success "Changes committed"
} else {
    Write-Success "No changes to commit (already up to date)"
}

# ============================================
# STEP 3: PUSH TO HETZNER
# ============================================
Write-Step "Pushing to Hetzner server..."
try {
    $pushOutput = git push hetzner HEAD:refs/heads/main 2>&1
    Write-Success "Code pushed to Hetzner"
} catch {
    Write-Error "Push failed: $_"
    exit 1
}

# ============================================
# STEP 4: REBUILD ON SERVER
# ============================================
Write-Step "Rebuilding on Hetzner server..."
Write-Host "    This will take 1-2 minutes..." -ForegroundColor Gray

$buildScript = @'
cd /opt/flipnosis/app
echo "Stopping PM2..."
pm2 stop all > /dev/null 2>&1 || true
echo "Building application..."
npm run build 2>&1 | tail -10
echo "Restarting PM2..."
pm2 restart all > /dev/null 2>&1 || pm2 start ecosystem.config.js > /dev/null 2>&1
pm2 save > /dev/null 2>&1
echo "BUILD_COMPLETE"
'@

try {
    $buildOutput = ssh root@159.69.242.154 $buildScript
    
    if ($buildOutput -match "BUILD_COMPLETE") {
        Write-Success "Server rebuilt successfully"
    } else {
        Write-Warning "Build completed with warnings"
        Write-Host "    Last 5 lines of output:" -ForegroundColor Gray
        $buildOutput | Select-Object -Last 5 | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
    }
} catch {
    Write-Error "Server rebuild failed: $_"
    Write-Warning "Continuing anyway - server may still work"
}

# ============================================
# STEP 5: PURGE CLOUDFLARE CACHE
# ============================================
if (-not $SkipCloudflare) {
    Write-Step "Purging Cloudflare cache..."
    
    $cfEmail = $env:CLOUDFLARE_EMAIL
    $cfApiKey = $env:CLOUDFLARE_API_KEY
    $cfZoneId = $env:CLOUDFLARE_ZONE_ID
    
    if ($cfEmail -and $cfApiKey -and $cfZoneId) {
        try {
            $headers = @{
                "X-Auth-Email" = $cfEmail
                "X-Auth-Key" = $cfApiKey
                "Content-Type" = "application/json"
            }
            
            $body = @{
                purge_everything = $true
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$cfZoneId/purge_cache" `
                -Method Post `
                -Headers $headers `
                -Body $body
            
            if ($response.success) {
                Write-Success "Cloudflare cache purged!"
            } else {
                Write-Warning "Cloudflare purge returned: $($response.errors)"
            }
        } catch {
            Write-Warning "Cloudflare purge failed: $_"
            Write-Host "    You'll need to manually purge or use direct IP" -ForegroundColor Yellow
        }
    } else {
        Write-Warning "Cloudflare credentials not set in environment"
        Write-Host "    To enable auto-purge, set these environment variables:" -ForegroundColor Yellow
        Write-Host "      CLOUDFLARE_EMAIL=your@email.com" -ForegroundColor Gray
        Write-Host "      CLOUDFLARE_API_KEY=your_api_key" -ForegroundColor Gray
        Write-Host "      CLOUDFLARE_ZONE_ID=your_zone_id" -ForegroundColor Gray
        Write-Host "`n    OR use direct IP to test: http://159.69.242.154" -ForegroundColor Yellow
    }
} else {
    Write-Warning "Skipping Cloudflare purge (use -SkipCloudflare:$false to enable)"
}

# ============================================
# STEP 6: VERIFICATION
# ============================================
Write-Step "Verifying deployment..."

# Check server status
try {
    $pmStatus = ssh root@159.69.242.154 "pm2 status | grep flipnosis-app"
    if ($pmStatus -match "online") {
        Write-Success "PM2 server is online"
    } else {
        Write-Warning "PM2 status unclear: $pmStatus"
    }
} catch {
    Write-Warning "Could not verify PM2 status"
}

# Check file timestamp
try {
    $fileTime = ssh root@159.69.242.154 "stat -c %y /opt/flipnosis/app/dist/index.html"
    Write-Success "Latest build: $fileTime"
} catch {
    Write-Warning "Could not check file timestamp"
}

# ============================================
# SUMMARY
# ============================================
Write-Host "`n"
Write-Host "============================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "`n"

Write-Host "What to do now:" -ForegroundColor Cyan
Write-Host "  1. Open browser in INCOGNITO/PRIVATE mode (Ctrl+Shift+N/P)" -ForegroundColor Yellow
Write-Host "  2. Go to: https://www.flipnosis.fun/test-tubes.html?gameId=..." -ForegroundColor Yellow
Write-Host "  3. Check console for: 'INFO: Skipping physics_join'" -ForegroundColor Yellow
Write-Host "`n"

if (-not $SkipCloudflare -and (-not $cfApiKey)) {
    Write-Host "TIP: To skip Cloudflare caching during development:" -ForegroundColor Cyan
    Write-Host "  Use direct IP: http://159.69.242.154/test-tubes.html?gameId=..." -ForegroundColor White
    Write-Host "`n"
}

Write-Host "To check server logs:" -ForegroundColor Cyan
Write-Host "  ssh root@159.69.242.154 'pm2 logs --lines 50'" -ForegroundColor White
Write-Host "`n"


