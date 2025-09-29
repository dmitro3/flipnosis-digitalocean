# Test Git Deploy Setup - Troubleshooting Script
# Usage: .\deployment\test-git-deploy.ps1 -ServerIP 159.69.242.154 -ServerUser root

param(
  [Parameter(Mandatory = $true)][string]$ServerIP,
  [string]$ServerUser = "root"
)

$ErrorActionPreference = "Continue"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Host "=== Git Deploy Troubleshooting ===" -ForegroundColor Yellow
Write-Host "Testing connection and setup to $ServerUser@$ServerIP" -ForegroundColor Yellow
Write-Host ""

# Test 1: SSH Connection
Write-Info "Test 1: SSH Connection"
try {
    $sshTest = & ssh -o ConnectTimeout=10 "$ServerUser@$ServerIP" "echo 'SSH connection successful'" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Ok $sshTest
    } else {
        Write-Fail "SSH connection failed: $sshTest"
    }
} catch {
    Write-Fail "SSH connection error: $($_.Exception.Message)"
}
Write-Host ""

# Test 2: SSH Key Authentication
Write-Info "Test 2: SSH Key Authentication"
$sshDir = Join-Path $HOME ".ssh"
$keyPath = Join-Path $sshDir "id_ed25519"

if (Test-Path $keyPath) {
    Write-Ok "SSH private key found: $keyPath"
    if (Test-Path "$keyPath.pub") {
        Write-Ok "SSH public key found: $keyPath.pub"
    } else {
        Write-Warn "SSH public key missing: $keyPath.pub"
    }
} else {
    Write-Fail "SSH private key missing: $keyPath"
}
Write-Host ""

# Test 3: Git Repository
Write-Info "Test 3: Local Git Repository"
if (Test-Path ".git") {
    Write-Ok "Git repository found"
    
    try {
        $remotes = & git remote
        Write-Info "Git remotes: $($remotes -join ', ')"
        
        if ($remotes -contains "hetzner") {
            $hetznerUrl = & git remote get-url hetzner
            Write-Ok "Hetzner remote found: $hetznerUrl"
        } else {
            Write-Warn "Hetzner remote not configured"
        }
    } catch {
        Write-Warn "Failed to check git remotes: $($_.Exception.Message)"
    }
} else {
    Write-Fail "Not in a git repository"
}
Write-Host ""

# Test 4: Server Directories
Write-Info "Test 4: Server Directory Structure"
try {
    $dirCheck = & ssh "$ServerUser@$ServerIP" "ls -la /opt/flipnosis/ 2>/dev/null || echo 'Directory not found'"
    Write-Info "Server directories:"
    Write-Host $dirCheck
} catch {
    Write-Warn "Failed to check server directories: $($_.Exception.Message)"
}
Write-Host ""

# Test 5: Git Bare Repository
Write-Info "Test 5: Server Git Repository"
try {
    $gitCheck = & ssh "$ServerUser@$ServerIP" "ls -la /opt/flipnosis/repo.git/ 2>/dev/null && echo 'Git repo exists' || echo 'Git repo missing'"
    Write-Host $gitCheck
} catch {
    Write-Warn "Failed to check git repository: $($_.Exception.Message)"
}
Write-Host ""

# Test 6: Post-receive Hook
Write-Info "Test 6: Post-receive Hook"
try {
    $hookCheck = & ssh "$ServerUser@$ServerIP" "ls -la /opt/flipnosis/repo.git/hooks/post-receive 2>/dev/null && echo 'Hook exists' || echo 'Hook missing'"
    Write-Host $hookCheck
} catch {
    Write-Warn "Failed to check post-receive hook: $($_.Exception.Message)"
}
Write-Host ""

# Test 7: Node.js and Dependencies
Write-Info "Test 7: Server Dependencies"
try {
    $nodeCheck = & ssh "$ServerUser@$ServerIP" "node --version 2>/dev/null && echo 'Node.js installed' || echo 'Node.js missing'"
    Write-Host $nodeCheck
    
    $npmCheck = & ssh "$ServerUser@$ServerIP" "npm --version 2>/dev/null && echo 'NPM installed' || echo 'NPM missing'"
    Write-Host $npmCheck
    
    $gitServerCheck = & ssh "$ServerUser@$ServerIP" "git --version 2>/dev/null && echo 'Git installed' || echo 'Git missing'"
    Write-Host $gitServerCheck
} catch {
    Write-Warn "Failed to check server dependencies: $($_.Exception.Message)"
}
Write-Host ""

# Test 8: Environment File
Write-Info "Test 8: Environment Configuration"
try {
    $envCheck = & ssh "$ServerUser@$ServerIP" "test -f /opt/flipnosis/shared/.env && echo 'Environment file exists' || echo 'Environment file missing'"
    Write-Host $envCheck
    
    if ($envCheck -match "exists") {
        $envContent = & ssh "$ServerUser@$ServerIP" "grep -v '^#' /opt/flipnosis/shared/.env | grep '=' | head -5"
        Write-Info "Environment variables (first 5):"
        Write-Host $envContent
    }
} catch {
    Write-Warn "Failed to check environment file: $($_.Exception.Message)"
}
Write-Host ""

# Test 9: Systemd Service
Write-Info "Test 9: Systemd Service"
try {
    $serviceCheck = & ssh "$ServerUser@$ServerIP" "systemctl is-enabled flipnosis-app 2>/dev/null || echo 'Service not enabled'"
    Write-Host "Service status: $serviceCheck"
    
    $serviceActive = & ssh "$ServerUser@$ServerIP" "systemctl is-active flipnosis-app 2>/dev/null || echo 'Service not active'"
    Write-Host "Service active: $serviceActive"
} catch {
    Write-Warn "Failed to check systemd service: $($_.Exception.Message)"
}
Write-Host ""

# Summary and Recommendations
Write-Host "=== Summary and Recommendations ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "If any tests failed, try these steps:" -ForegroundColor Yellow
Write-Host "1. Run setup: .\deployment\setup-hetzner-git-deploy-fixed.ps1 -ServerIP $ServerIP -ServerUser $ServerUser" -ForegroundColor White
Write-Host "2. Configure environment: ssh $ServerUser@$ServerIP 'nano /opt/flipnosis/shared/.env'" -ForegroundColor White
Write-Host "3. Test deploy: .\deployment\deploy-hetzner-git-fixed.ps1 'Test deployment'" -ForegroundColor White
Write-Host "4. Check status: .\deployment\check-hetzner-status-fixed.ps1 -ServerIP $ServerIP -ServerUser $ServerUser" -ForegroundColor White
Write-Host ""
Write-Host "For detailed logs: ssh $ServerUser@$ServerIP 'journalctl -u flipnosis-app -f'" -ForegroundColor White
