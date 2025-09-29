# Check service, logs, and health on Hetzner
# Usage: .\deployment\check-hetzner-status.ps1 -ServerIP 159.69.242.154 -ServerUser root

param(
  [Parameter(Mandatory = $true)][string]$ServerIP,
  [string]$ServerUser = "root"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }

Write-Info "Service status"
ssh "$ServerUser@$ServerIP" "systemctl status flipnosis-app --no-pager -l | sed -n '1,80p'" | cat

Write-Info "Recent journal logs"
ssh "$ServerUser@$ServerIP" "journalctl -u flipnosis-app -n 100 --no-pager" | cat

Write-Info "Node processes"
ssh "$ServerUser@$ServerIP" "ps aux | grep node | grep -v grep" | cat

Write-Info "Health checks"
try { $r = Invoke-WebRequest -Uri "http://$ServerIP/health" -UseBasicParsing -TimeoutSec 5; Write-Ok "HTTP /health: $($r.StatusCode)" } catch {}
try { $r = Invoke-WebRequest -Uri "https://$ServerIP/health" -UseBasicParsing -TimeoutSec 5; Write-Ok "HTTPS /health: $($r.StatusCode)" } catch {}

Write-Ok "Done"


