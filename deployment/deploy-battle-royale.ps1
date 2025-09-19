# Battle Royale Deployment Script for Hetzner Server
# This script deploys the Battle Royale functionality to the production server

Write-Host "🚀 Starting Battle Royale Deployment..." -ForegroundColor Green

# Server configuration
$SERVER_IP = "159.69.208.115"
$SERVER_USER = "root"
$APP_DIR = "/opt/flipnosis/app"
$DB_PATH = "$APP_DIR/server/flipz.db"

Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "  Server: $SERVER_IP" -ForegroundColor Gray
Write-Host "  User: $SERVER_USER" -ForegroundColor Gray
Write-Host "  App Directory: $APP_DIR" -ForegroundColor Gray
Write-Host "  Database: $DB_PATH" -ForegroundColor Gray

# Function to execute remote commands
function Execute-Remote {
    param($Command)
    Write-Host "🔧 Executing: $Command" -ForegroundColor Cyan
    ssh $SERVER_USER@$SERVER_IP $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Command failed: $Command" -ForegroundColor Red
        exit 1
    }
}

# Function to copy files to server
function Copy-ToServer {
    param($LocalPath, $RemotePath)
    Write-Host "📁 Copying: $LocalPath -> $RemotePath" -ForegroundColor Cyan
    scp -r $LocalPath $SERVER_USER@${SERVER_IP}:$RemotePath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ File copy failed: $LocalPath" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔍 Step 1: Pre-deployment Checks" -ForegroundColor Yellow

# Check if server is accessible
Write-Host "🔌 Testing server connection..." -ForegroundColor Gray
ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP "echo 'Server accessible'" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cannot connect to server. Please check VPN and SSH keys." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Server connection successful" -ForegroundColor Green

# Check current server status
Write-Host "📊 Checking current server status..." -ForegroundColor Gray
Execute-Remote "cd $APP_DIR && pm2 status"

Write-Host ""
Write-Host "🗄️ Step 2: Database Schema Migration" -ForegroundColor Yellow

# Create backup of current database
Write-Host "💾 Creating database backup..." -ForegroundColor Gray
Execute-Remote "cd $APP_DIR && cp server/flipz.db server/flipz.db.backup.$(date +%Y%m%d_%H%M%S)"

# Copy database schema file
Write-Host "📋 Copying Battle Royale schema..." -ForegroundColor Gray
Copy-ToServer "database-battle-royale-schema.sql" "$APP_DIR/"

# Apply database schema
Write-Host "🔧 Applying Battle Royale database schema..." -ForegroundColor Gray
Execute-Remote "cd $APP_DIR && sqlite3 server/flipz.db < database-battle-royale-schema.sql"

# Verify tables were created
Write-Host "✅ Verifying database schema..." -ForegroundColor Gray
Execute-Remote "cd $APP_DIR && sqlite3 server/flipz.db '.tables' | grep battle_royale"

Write-Host ""
Write-Host "📂 Step 3: Code Deployment" -ForegroundColor Yellow

# Stop the application
Write-Host "⏸️ Stopping application..." -ForegroundColor Gray
Execute-Remote "cd $APP_DIR && pm2 stop all"

# Create deployment backup
Write-Host "💾 Creating code backup..." -ForegroundColor Gray
Execute-Remote "cd /opt/flipnosis && cp -r app app.backup.$(date +%Y%m%d_%H%M%S)"

# Deploy server files
Write-Host "📤 Deploying server files..." -ForegroundColor Gray
Copy-ToServer "server/handlers/BattleRoyaleGameManager.js" "$APP_DIR/server/handlers/"
Copy-ToServer "server/handlers/server-socketio.js" "$APP_DIR/server/handlers/"
Copy-ToServer "server/services/database.js" "$APP_DIR/server/services/"
Copy-ToServer "server/routes/api.js" "$APP_DIR/server/routes/"

# Deploy contract updates
Write-Host "📤 Deploying contract updates..." -ForegroundColor Gray
Copy-ToServer "contracts/NFTFlipGame.sol" "$APP_DIR/contracts/"

# Deploy frontend files
Write-Host "📤 Deploying frontend files..." -ForegroundColor Gray
Copy-ToServer "src/components/BattleRoyale/" "$APP_DIR/src/components/"
Copy-ToServer "src/pages/CreateFlip.jsx" "$APP_DIR/src/pages/"
Copy-ToServer "src/Routes.jsx" "$APP_DIR/src/"
Copy-ToServer "src/services/ContractService.js" "$APP_DIR/src/services/"

Write-Host ""
Write-Host "🏗️ Step 4: Build and Install" -ForegroundColor Yellow

# Install dependencies (if any new ones)
Write-Host "📦 Installing dependencies..." -ForegroundColor Gray
Execute-Remote "cd $APP_DIR && npm install"

# Build frontend
Write-Host "🔨 Building frontend..." -ForegroundColor Gray
Execute-Remote "cd $APP_DIR && npm run build"

Write-Host ""
Write-Host "🚀 Step 5: Application Restart" -ForegroundColor Yellow

# Start the application
Write-Host "▶️ Starting application..." -ForegroundColor Gray
Execute-Remote "cd $APP_DIR && pm2 start ecosystem.config.js"

# Wait for startup
Write-Host "⏳ Waiting for application startup..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Check application status
Write-Host "📊 Checking application status..." -ForegroundColor Gray
Execute-Remote "cd $APP_DIR && pm2 status"

# Test API endpoints
Write-Host "🧪 Testing API endpoints..." -ForegroundColor Gray
Execute-Remote "curl -s http://localhost:3000/api/health | head -1"

Write-Host ""
Write-Host "🧪 Step 6: Deployment Verification" -ForegroundColor Yellow

# Test database tables
Write-Host "🗄️ Verifying Battle Royale tables..." -ForegroundColor Gray
Execute-Remote "cd $APP_DIR && sqlite3 server/flipz.db 'SELECT name FROM sqlite_master WHERE type=\"table\" AND name LIKE \"battle_royale%\";'"

# Test API endpoints
Write-Host "🌐 Testing Battle Royale API..." -ForegroundColor Gray
Execute-Remote "curl -s -X GET http://localhost:3000/api/battle-royale?limit=1 | head -1"

# Check logs for errors
Write-Host "📋 Checking application logs..." -ForegroundColor Gray
Execute-Remote "cd $APP_DIR && pm2 logs --lines 20"

Write-Host ""
Write-Host "✅ Battle Royale Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Test Battle Royale game creation at: https://flipnosis.fun/create" -ForegroundColor Gray
Write-Host "  2. Deploy updated smart contract with Battle Royale functions" -ForegroundColor Gray
Write-Host "  3. Test end-to-end Battle Royale gameplay" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 Deployment Summary:" -ForegroundColor Yellow
Write-Host "  ✅ Database schema updated" -ForegroundColor Green
Write-Host "  ✅ Server code deployed" -ForegroundColor Green
Write-Host "  ✅ Frontend code deployed" -ForegroundColor Green
Write-Host "  ✅ Application restarted" -ForegroundColor Green
Write-Host "  ✅ Basic verification passed" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Access your application:" -ForegroundColor Cyan
Write-Host "  https://flipnosis.fun" -ForegroundColor Blue
Write-Host ""

# Final status check
Execute-Remote "cd $APP_DIR && pm2 status && echo '🎮 Battle Royale is ready!'"
