# Safe Migration Script for Missing Database Tables
# This script safely adds missing tables to the server database without breaking existing data

param(
    [string]$ServerIP = "159.69.242.154",
    [string]$Description = "Add missing database tables safely"
)

Write-Host "🚀 Starting Safe Database Migration..." -ForegroundColor Green
Write-Host "📋 Description: $Description" -ForegroundColor Cyan
Write-Host "🌐 Server: $ServerIP" -ForegroundColor Cyan

# Check if migration file exists
$migrationFile = "migration-add-missing-tables-safe.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Migration file found: $migrationFile" -ForegroundColor Green

try {
    # Copy migration file to server
    Write-Host "📤 Copying migration file to server..." -ForegroundColor Yellow
    scp $migrationFile "root@${ServerIP}:/tmp/migration.sql"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to copy migration file to server"
    }
    
    Write-Host "✅ Migration file copied successfully" -ForegroundColor Green
    
    # Run migration on server
    Write-Host "🔧 Running migration on server..." -ForegroundColor Yellow
    
    $migrationCommand = @"
cd /opt/flipnosis/app
echo "📋 Starting database migration..."
echo "📊 Current tables before migration:"
sqlite3 server/flipz.db ".tables"
echo ""
echo "🔧 Running migration script..."
sqlite3 server/flipz.db < /tmp/migration.sql
echo ""
echo "📊 Tables after migration:"
sqlite3 server/flipz.db ".tables"
echo ""
echo "📈 Verification - checking if all required tables exist:"
sqlite3 server/flipz.db "
SELECT 
    CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='game_events') 
         THEN '✅ game_events' ELSE '❌ game_events' END as game_events_status,
    CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='admin_actions') 
         THEN '✅ admin_actions' ELSE '❌ admin_actions' END as admin_actions_status,
    CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='ready_nfts') 
         THEN '✅ ready_nfts' ELSE '❌ ready_nfts' END as ready_nfts_status,
    CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='game_shares') 
         THEN '✅ game_shares' ELSE '❌ game_shares' END as game_shares_status,
    CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='notifications') 
         THEN '✅ notifications' ELSE '❌ notifications' END as notifications_status,
    CASE WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='messages') 
         THEN '✅ messages' ELSE '❌ messages' END as messages_status;
"
echo ""
echo "🧹 Cleaning up migration file..."
rm /tmp/migration.sql
echo "✅ Migration completed successfully!"
"@
    
    ssh "root@${ServerIP}" $migrationCommand
    
    if ($LASTEXITCODE -ne 0) {
        throw "Migration failed on server"
    }
    
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host "📋 All missing tables have been added safely" -ForegroundColor Green
    Write-Host "🔍 No existing data was modified" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔧 Please check the server connection and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎉 Safe Migration Complete!" -ForegroundColor Green
Write-Host "📊 Your server now has all required tables for:" -ForegroundColor Cyan
Write-Host "   • Event-driven system (game_events)" -ForegroundColor White
Write-Host "   • Admin actions tracking (admin_actions)" -ForegroundColor White
Write-Host "   • NFT pre-loading (ready_nfts)" -ForegroundColor White
Write-Host "   • Social sharing XP (game_shares)" -ForegroundColor White
Write-Host "   • User notifications (notifications)" -ForegroundColor White
Write-Host "   • General messaging (messages)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Your application should now work without database errors!" -ForegroundColor Green

