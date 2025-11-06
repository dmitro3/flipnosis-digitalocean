# Complete deployment fix - ensures public folder is tracked and hook is fixed
# Usage: .\deployment\fix-deployment-complete.ps1

param(
    [string]$ServerIP = "159.69.242.154",
    [string]$ServerUser = "root"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "================================================"
Write-Info "Complete Deployment Fix"
Write-Info "================================================"
Write-Host ""

# Step 1: Ensure public folder is tracked in git
Write-Info "Step 1: Checking if public folder is tracked in git..."
$publicFiles = & git ls-files public/ 2>&1
if ($LASTEXITCODE -eq 0 -and $publicFiles.Count -gt 0) {
    Write-Ok "✓ public folder is tracked in git ($($publicFiles.Count) files)"
} else {
    Write-Warn "public folder may not be tracked in git"
    Write-Info "Adding public folder to git..."
    & git add public/
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "✓ Added public folder to git"
        Write-Info "Committing public folder..."
        try {
            & git commit -m "Ensure public folder is tracked in git" 2>&1 | Out-Null
            Write-Ok "✓ Committed public folder"
        } catch {
            Write-Info "No changes to commit (already tracked)"
        }
    } else {
        Write-Fail "Failed to add public folder to git"
        throw "Git add failed"
    }
}

# Step 2: Fix the git hook on server
Write-Host ""
Write-Info "Step 2: Fixing git deployment hook on server..."
& .\deployment\fix-git-deploy-hook.ps1 -ServerIP $ServerIP -ServerUser $ServerUser
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Failed to fix git hook"
    throw "Hook fix failed"
}

Write-Host ""
Write-Ok "================================================"
Write-Ok "Deployment Fix Complete!"
Write-Ok "================================================"
Write-Host ""
Write-Host "Now deploy your changes:" -ForegroundColor Cyan
Write-Host ".\deployment\deploy-hetzner-git-fixed.ps1 `"Deploy with fixed hook`"" -ForegroundColor White
Write-Host ""

