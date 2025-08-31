# Event System Deployment Script
# This script deploys the new event-driven system to the production server

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

Write-Host "🚀 Deploying Event System to Production..." -ForegroundColor Green
Write-Host "📝 Commit Message: $CommitMessage" -ForegroundColor Yellow

# Configuration
$SERVER_IP = "159.69.242.154"
$SERVER_USER = "root"
$APP_PATH = "/opt/flipnosis/app"
$DB_PATH = "$APP_PATH/server/flipz.db"

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

function Write-Step {
    param([string]$Message, [string]$Color = $Green)
    Write-Host "`n📋 $Message" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Cyan
}

try {
    # Step 1: Database Migration
    Write-Step "Step 1: Running Database Migration" $Yellow
    
    $migrationScript = @"
-- Event System Migration
-- Adding game_events table and event tracking fields

-- Create game_events table
CREATE TABLE IF NOT EXISTS game_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT,
    target_users TEXT,
    processed BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_type ON game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_game_events_processed ON game_events(processed);
CREATE INDEX IF NOT EXISTS idx_game_events_created ON game_events(created_at);

-- Add event tracking fields to games table
ALTER TABLE games ADD COLUMN last_event_id INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN event_version INTEGER DEFAULT 0;

-- Verify migration
SELECT 'Event system migration completed' as status;
"@

    $migrationScript | ssh ${SERVER_USER}@${SERVER_IP} "cd $APP_PATH/server && sqlite3 $DB_PATH"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database migration completed successfully"
    } else {
        Write-Error "Database migration failed"
        exit 1
    }

    # Step 2: Deploy Server Code
    Write-Step "Step 2: Deploying Server Code" $Yellow
    
    # Use the existing deployment script
    $deployScript = ".\deployment\deploy-hetzner-git-fixed.ps1"
    if (Test-Path $deployScript) {
        & $deployScript $CommitMessage
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Server code deployed successfully"
        } else {
            Write-Error "Server code deployment failed"
            exit 1
        }
    } else {
        Write-Error "Deployment script not found: $deployScript"
        exit 1
    }

    # Step 3: Verify Event System
    Write-Step "Step 3: Verifying Event System" $Yellow
    
    $verificationScript = @"
-- Verify event system tables and fields
SELECT 'game_events table exists' as check_item, 
       CASE WHEN EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='game_events') 
            THEN 'PASS' ELSE 'FAIL' END as status;

SELECT 'games table has event fields' as check_item,
       CASE WHEN EXISTS (SELECT 1 FROM pragma_table_info('games') WHERE name='last_event_id') 
            THEN 'PASS' ELSE 'FAIL' END as status;

SELECT 'event indexes exist' as check_item,
       CASE WHEN EXISTS (SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_game_events_game_id') 
            THEN 'PASS' ELSE 'FAIL' END as status;

-- Show current event system status
SELECT 'Current game_events count' as metric, COUNT(*) as value FROM game_events;
SELECT 'Games with event tracking' as metric, COUNT(*) as value FROM games WHERE last_event_id > 0;
"@

    Write-Info "Running verification checks..."
    $verificationScript | ssh ${SERVER_USER}@${SERVER_IP} "cd $APP_PATH/server && sqlite3 $DB_PATH"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Event system verification completed"
    } else {
        Write-Error "Event system verification failed"
        exit 1
    }

    # Step 4: Test Event System
    Write-Step "Step 4: Testing Event System" $Yellow
    
    Write-Info "Testing event system functionality..."
    
    # Test event emission
    $testEventScript = @"
-- Test event emission
INSERT INTO game_events (game_id, event_type, event_data, target_users, processed)
VALUES ('test_game_123', 'test_event', '{"test": "data"}', '["test_user"]', 1);

SELECT 'Test event created' as status, COUNT(*) as event_count FROM game_events WHERE game_id = 'test_game_123';

-- Clean up test data
DELETE FROM game_events WHERE game_id = 'test_game_123';
"@

    $testEventScript | ssh ${SERVER_USER}@${SERVER_IP} "cd $APP_PATH/server && sqlite3 $DB_PATH"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Event system test completed successfully"
    } else {
        Write-Error "Event system test failed"
        exit 1
    }

    # Step 5: Restart Services
    Write-Step "Step 5: Restarting Services" $Yellow
    
    Write-Info "Restarting application services..."
    ssh ${SERVER_USER}@${SERVER_IP} "cd $APP_PATH && pm2 restart all"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Services restarted successfully"
    } else {
        Write-Error "Service restart failed"
        exit 1
    }

    # Step 6: Final Verification
    Write-Step "Step 6: Final System Check" $Yellow
    
    Write-Info "Checking application status..."
    ssh ${SERVER_USER}@${SERVER_IP} "cd $APP_PATH && pm2 status"
    
    Write-Info "Checking server logs for event system..."
    ssh ${SERVER_USER}@${SERVER_IP} "cd $APP_PATH && tail -n 20 logs/app.log | grep -i event"
    
    Write-Success "Event system deployment completed successfully!"
    Write-Host "`n🎉 Event-driven system is now live!" -ForegroundColor $Green
    Write-Host "📊 Benefits:" -ForegroundColor $Cyan
    Write-Host "   • Targeted notifications to specific users" -ForegroundColor $Cyan
    Write-Host "   • Better scalability for multiple concurrent users" -ForegroundColor $Cyan
    Write-Host "   • Improved debugging and event tracking" -ForegroundColor $Cyan
    Write-Host "   • Event persistence for replay capability" -ForegroundColor $Cyan
    
    Write-Host "`n🔧 Next Steps:" -ForegroundColor $Yellow
    Write-Host "   1. Test offer acceptance flow" -ForegroundColor $Yellow
    Write-Host "   2. Monitor event emission in logs" -ForegroundColor $Yellow
    Write-Host "   3. Verify targeted notifications work" -ForegroundColor $Yellow
    Write-Host "   4. Check database for event records" -ForegroundColor $Yellow

} catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
    exit 1
}
