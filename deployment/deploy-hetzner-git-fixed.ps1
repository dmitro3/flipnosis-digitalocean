# One-command deploy to Hetzner via Git push
# Usage: .\deployment\deploy-hetzner-git-fixed.ps1 "Your commit message"

param(
  [string]$Message = "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Starting Git deploy to Hetzner..."

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

# Get server IP for health checks
try {
    $remoteUrl = & git remote get-url hetzner
    $ServerIP = (($remoteUrl -split '@')[1] -split ':')[0]
    Write-Info "Detected server IP: $ServerIP"
} catch {
    Write-Warn "Could not detect server IP from git remote"
    $ServerIP = $null
}

# Push to hetzner remote
Write-Info "Pushing to hetzner remote..."
try {
    # Capture both stdout and stderr but don't treat hook output as errors
    $pushOutput = & git push hetzner HEAD:refs/heads/main 2>&1
    # Git push returns 0 on success, regardless of hook output
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Successfully pushed to hetzner"
        Write-Info "Post-receive hook output:"
        # Show hook output but don't treat it as error
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
    # Only show real errors, not hook output
    if ($_.Exception.Message -notlike "*remote:*") {
        Write-Fail "Push to hetzner failed: $($_.Exception.Message)"
        throw
    } else {
        Write-Ok "Push completed (hook output captured)"
    }
}

# Wait a moment for deployment to process
Write-Info "Waiting for deployment to complete..."
Start-Sleep -Seconds 5

# Health checks
if ($ServerIP) {
    Write-Info "Running health checks..."
    
    # Test HTTP endpoint
    try {
        $httpResponse = Invoke-WebRequest -Uri "http://$ServerIP/health" -UseBasicParsing -TimeoutSec 10
        Write-Ok "HTTP health check: $($httpResponse.StatusCode)"
    } catch {
        Write-Warn "HTTP health check failed: $($_.Exception.Message)"
    }
    
    # Test HTTPS endpoint
    try {
        # Skip certificate validation for self-signed certs
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
        $httpsResponse = Invoke-WebRequest -Uri "https://$ServerIP/health" -UseBasicParsing -TimeoutSec 10
        Write-Ok "HTTPS health check: $($httpsResponse.StatusCode)"
    } catch {
        Write-Host "[WARN] HTTPS health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Test main page
    try {
        $mainResponse = Invoke-WebRequest -Uri "https://$ServerIP/" -UseBasicParsing -TimeoutSec 10
        Write-Ok "Main page check: $($mainResponse.StatusCode)"
    } catch {
        Write-Host "[WARN] Main page check failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Ok "Deployment complete!"
Write-Host ""
Write-Host "To check detailed status, run:" -ForegroundColor Yellow
if ($ServerIP) {
    Write-Host ".\deployment\check-hetzner-status.ps1 -ServerIP $ServerIP" -ForegroundColor Yellow
} else {
    Write-Host ".\deployment\check-hetzner-status.ps1 -ServerIP <YOUR_SERVER_IP>" -ForegroundColor Yellow
}
