# Add missing columns to battle_royale_games on Hetzner server
# This ONLY adds columns - does NOT modify existing data

param(
    [string]$ServerIP = "159.69.242.154",
    [string]$ServerUser = "root",
    [string]$AppDir = "/opt/flipnosis/app"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Info "Adding missing columns to battle_royale_games table on Hetzner server..."
Write-Info "Server: $ServerIP"
Write-Info "App Directory: $AppDir"

# Check server connection
Write-Info "Testing server connection..."
try {
    $test = ssh -o ConnectTimeout=10 $ServerUser@$ServerIP "echo 'Connected'" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Cannot connect to server. Check SSH keys and network."
        exit 1
    }
    Write-Ok "Server connection successful"
} catch {
    Write-Fail "Connection failed: $($_.Exception.Message)"
    exit 1
}

# Find the database file
Write-Info "Finding database file..."
$dbPaths = @(
    "$AppDir/server/database.sqlite",
    "$AppDir/server/flipz.db",
    "$AppDir/database.sqlite"
)

$dbPath = $null
foreach ($path in $dbPaths) {
    $exists = ssh $ServerUser@$ServerIP "test -f $path && echo 'exists' || echo 'not found'"
    if ($exists -eq "exists") {
        $dbPath = $path
        Write-Ok "Found database at: $dbPath"
        break
    }
}

if (!$dbPath) {
    Write-Fail "Could not find database file. Checked:"
    foreach ($path in $dbPaths) {
        Write-Host "  - $path" -ForegroundColor Gray
    }
    exit 1
}

# Copy SQL script to server
Write-Info "Copying SQL script to server..."
$remoteSql = "/tmp/add-columns-direct.sql"
scp scripts/add-columns-direct.sql ${ServerUser}@${ServerIP}:${remoteSql}
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Failed to copy SQL script to server"
    exit 1
}
Write-Ok "SQL script copied"

# Run SQL script directly using sqlite3 command line tool
Write-Info "Checking and adding columns..."
Write-Host ""
$alterOutput = ssh $ServerUser@$ServerIP "sqlite3 $dbPath < $remoteSql 2>&1"

# Check output - "duplicate column" errors are fine (columns already exist)
if ($alterOutput -match "duplicate column") {
    Write-Ok "All columns already exist (this is good!)"
} elseif ($alterOutput) {
    Write-Info "SQL output: $alterOutput"
}

# Now fix existing completed games that might have winner but no winner_address
Write-Info "Fixing existing completed games..."
Write-Host ""
$fixSql = "/tmp/fix-existing-winners.sql"
scp scripts/fix-existing-winners.sql ${ServerUser}@${ServerIP}:${fixSql}
if ($LASTEXITCODE -eq 0) {
    $fixOutput = ssh $ServerUser@$ServerIP "sqlite3 $dbPath < $fixSql 2>&1"
    Write-Host $fixOutput
    ssh $ServerUser@$ServerIP "rm -f $fixSql" 2>&1 | Out-Null
}

# Clean up
Write-Info "Cleaning up..."
ssh $ServerUser@$ServerIP "rm -f $remoteSql" 2>&1 | Out-Null

Write-Host ""
Write-Ok "✅ Database update complete!"
Write-Info "All required columns exist, and existing completed games have been fixed."

Write-Ok "Done! Columns have been added to the remote database."

