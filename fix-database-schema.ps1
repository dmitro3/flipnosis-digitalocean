# Fix Battle Royale Database Schema
# This script adds the missing columns to the battle_royale_games table

Write-Host "🔧 Fixing Battle Royale database schema..." -ForegroundColor Yellow

# Check if database file exists
$dbPath = "flipnosis.db"
if (-not (Test-Path $dbPath)) {
    Write-Host "❌ Database file not found: $dbPath" -ForegroundColor Red
    Write-Host "Please make sure you're running this from the correct directory" -ForegroundColor Red
    exit 1
}

# Run the migration
Write-Host "📝 Running schema migration..." -ForegroundColor Cyan
sqlite3 $dbPath < fix-battle-royale-schema.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database schema fixed successfully!" -ForegroundColor Green
    Write-Host "🎮 Battle Royale games should now work properly" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to fix database schema" -ForegroundColor Red
    Write-Host "Error code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Ready to create Battle Royale games!" -ForegroundColor Green
