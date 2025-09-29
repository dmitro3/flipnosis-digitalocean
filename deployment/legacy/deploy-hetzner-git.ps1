# One-command deploy to Hetzner via Git push
# Usage:
#   .\deployment\deploy-hetzner-git.ps1 "Your commit message"

param(
  [string]$Message = "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Committing and pushing to hetzner remote..."

# Ensure git repo
if (!(Test-Path ".git")) { throw "Not a git repository. Init git first." }

# Add and commit
git add -A
try {
  git commit -m $Message | Out-Null
} catch {
  Write-Info "Nothing to commit; continuing"
}

# Ensure hetzner remote exists
$remotes = git remote
if ($remotes -notcontains "hetzner") {
  throw "Missing 'hetzner' remote. Run setup script: .\\deployment\\setup-hetzner-git-deploy.ps1 -ServerIP <IP>"
}

# Push main to server bare repo
git push hetzner HEAD:refs/heads/main
Write-Ok "Pushed to hetzner"

Write-Info "Deployment triggered on server (post-receive). Checking status..."

try {
  # Try to read health endpoint over HTTP and HTTPS (depends on nginx/SSL)
  $ServerIPGuess = (git remote get-url hetzner) -replace '.*@','' -replace ':.*',''
  Write-Info "Server IP: $ServerIPGuess"
  Start-Sleep -Seconds 3
  $healthHttp = Invoke-WebRequest -Uri "http://$ServerIPGuess/health" -UseBasicParsing -TimeoutSec 5
  Write-Ok "HTTP health: $($healthHttp.StatusCode)"
} catch {}

try {
  $healthHttps = Invoke-WebRequest -Uri "https://$ServerIPGuess/health" -UseBasicParsing -TimeoutSec 5
  Write-Ok "HTTPS health: $($healthHttps.StatusCode)"
} catch {}

Write-Ok "Deploy complete"


