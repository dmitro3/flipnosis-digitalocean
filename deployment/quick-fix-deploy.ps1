# Quick fix deployment for Hetzner 500 error
# This temporarily disables the new Glass Tube Game components to get the server running

param(
  [string]$Message = "Quick fix: Disable Glass Tube Game components temporarily"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Quick fix deployment to resolve 500 error..."

# Ensure we're in a git repository
if (!(Test-Path ".git")) { 
    Write-Fail "Not a git repository. Initialize git first."
    throw "Not a git repository"
}

# Check if hetzner remote exists
try {
    $remotes = & git remote
    if ($remotes -notcontains "hetzner") {
        Write-Fail "Missing 'hetzner' remote. Run setup first:"
        Write-Host ".\deployment\setup-hetzner-git-deploy-fixed.ps1 -ServerIP <YOUR_SERVER_IP>" -ForegroundColor Yellow
        throw "Missing hetzner remote"
    }
} catch {
    Write-Fail "Failed to check git remotes: $($_.Exception.Message)"
    throw
}

# Add all changes
Write-Info "Adding all changes..."
& git add -A

# Commit changes
Write-Info "Committing changes: $Message"
try {
    $commitResult = & git commit -m $Message 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Changes committed"
    } else {
        Write-Info "No changes to commit (already up to date)"
    }
} catch {
    Write-Info "No changes to commit or commit failed: $($_.Exception.Message)"
}

# Push to hetzner remote
Write-Info "Pushing to hetzner remote..."
try {
    $pushOutput = & git push hetzner HEAD:refs/heads/main 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Successfully pushed to hetzner"
        Write-Info "Post-receive hook output:"
        $pushOutput | ForEach-Object { 
            if ($_ -like "remote:*") {
                $hookOutput = $_ -replace "^remote: ", ""
                Write-Host "  $hookOutput" -ForegroundColor Gray
            }
        }
    } else {
        Write-Fail "Git push failed with exit code: $LASTEXITCODE"
        Write-Host $pushOutput -ForegroundColor Red
        throw "Git push failed"
    }
} catch {
    if ($_.Exception.Message -notlike "*remote:*") {
        Write-Fail "Push to hetzner failed: $($_.Exception.Message)"
        throw
    } else {
        Write-Ok "Push completed (hook output captured)"
    }
}

Write-Ok "Quick fix deployment complete!"
Write-Host ""
Write-Host "The server should now be running without 500 errors." -ForegroundColor Green
Write-Host "Once confirmed working, we can re-enable the Glass Tube Game components." -ForegroundColor Yellow
