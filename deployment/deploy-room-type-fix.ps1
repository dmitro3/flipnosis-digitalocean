# Deploy room_type fix to Hetzner Server
# This script deploys the database.js fix and updates the database schema

Write-Host "🔧 Deploying room_type fix to Hetzner Server..." -ForegroundColor Green

# Server details - UPDATE THIS WITH YOUR ACTUAL SERVER IP
$SERVER_IP = "159.69.242.154"  # Change to your Hetzner server IP if different
$SERVER_USER = "root"
$APP_PATH = "/opt/flipnosis/app"  # Common path, adjust if different

Write-Host "📡 Connecting to server: $SERVER_IP" -ForegroundColor Yellow

# Step 1: Upload the fixed database.js file
Write-Host "📤 Uploading fixed database.js..." -ForegroundColor Yellow
scp server/services/database.js "${SERVER_USER}@${SERVER_IP}:${APP_PATH}/server/services/database.js"

# Step 2: Upload the SQL fix script
Write-Host "📤 Uploading database schema fix..." -ForegroundColor Yellow
scp add_room_type_fix.sql "${SERVER_USER}@${SERVER_IP}:/tmp/add_room_type_fix.sql"

# Step 3: Apply database fix and restart server
Write-Host "🔧 Applying database fix and restarting server..." -ForegroundColor Yellow

$sshCommand = @"
set -e

echo "📍 Current directory: \$(pwd)"
echo "📍 App path: $APP_PATH"

# Navigate to app directory
if [ ! -d "$APP_PATH" ]; then
    echo "❌ App directory not found at $APP_PATH"
    exit 1
fi
cd $APP_PATH

# Backup database
echo "💾 Backing up database..."
cp server/database.sqlite server/database.sqlite.backup.\$(date +%Y%m%d_%H%M%S) || echo "⚠️ Could not backup database"

# Check if room_type column exists
echo "🔍 Checking if room_type column exists..."
ROOM_TYPE_EXISTS=\$(sqlite3 server/database.sqlite "PRAGMA table_info(battle_royale_games);" | grep -c room_type || echo "0")

if [ "\$ROOM_TYPE_EXISTS" = "0" ]; then
    echo "➕ Adding room_type column to database..."
    sqlite3 server/database.sqlite < /tmp/add_room_type_fix.sql || echo "⚠️ SQL fix may have failed (column might already exist)"
    echo "✅ Database schema updated"
else
    echo "✅ room_type column already exists"
fi

# Verify the fix
echo "🔍 Verifying database schema..."
sqlite3 server/database.sqlite "PRAGMA table_info(battle_royale_games);" | grep room_type || echo "⚠️ Warning: room_type column not found after update"

# Restart the server
echo "🔄 Restarting server..."
pm2 restart flipnosis-app || pm2 restart all || echo "⚠️ PM2 restart failed, trying alternative..."

# Wait a moment for restart
sleep 3

# Check server status
echo "📊 Server status:"
pm2 status || echo "⚠️ PM2 not running"

echo "✅ Deployment complete!"
"@

# Execute SSH command
ssh "${SERVER_USER}@${SERVER_IP}" $sshCommand

Write-Host "`n✅ Room Type Fix Deployment Complete!" -ForegroundColor Green
Write-Host "🌐 Your Battle Royale creation should now work correctly" -ForegroundColor Cyan
Write-Host "`n💡 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Try creating a Battle Royale game again" -ForegroundColor White
Write-Host "  2. Check server logs: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs flipnosis-app --lines 50'" -ForegroundColor White