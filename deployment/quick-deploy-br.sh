#!/bin/bash
# Quick Battle Royale Deployment for Hetzner Server

set -e

SERVER_IP="159.69.208.115"
SERVER_USER="root"
APP_DIR="/opt/flipnosis/app"

echo "🚀 Quick Battle Royale Deployment Starting..."
echo "📡 Target: $SERVER_USER@$SERVER_IP:$APP_DIR"

# Function to execute remote commands
execute_remote() {
    echo "🔧 Executing: $1"
    ssh $SERVER_USER@$SERVER_IP "$1"
}

# Function to copy files
copy_file() {
    echo "📁 Copying: $1 -> $2"
    scp "$1" "$SERVER_USER@$SERVER_IP:$2"
}

# Test connection
echo "🔌 Testing server connection..."
execute_remote "echo 'Connected successfully'"

# Create backup
echo "💾 Creating backup..."
execute_remote "cd $APP_DIR && cp server/flipz.db server/flipz.db.backup.\$(date +%Y%m%d_%H%M%S)"

# Deploy database schema
echo "🗄️ Deploying database schema..."
copy_file "database-battle-royale-schema.sql" "$APP_DIR/"
execute_remote "cd $APP_DIR && sqlite3 server/flipz.db < database-battle-royale-schema.sql"

# Verify schema
echo "✅ Verifying database schema..."
execute_remote "cd $APP_DIR && sqlite3 server/flipz.db '.tables' | grep battle_royale || echo 'Tables created'"

# Stop application
echo "⏸️ Stopping application..."
execute_remote "cd $APP_DIR && pm2 stop all"

# Deploy server files
echo "📤 Deploying server files..."
copy_file "server/handlers/BattleRoyaleGameManager.js" "$APP_DIR/server/handlers/"
copy_file "server/handlers/server-socketio.js" "$APP_DIR/server/handlers/"
copy_file "server/services/database.js" "$APP_DIR/server/services/"
copy_file "server/routes/api.js" "$APP_DIR/server/routes/"

# Deploy frontend files
echo "📤 Deploying frontend files..."
execute_remote "mkdir -p $APP_DIR/src/components/BattleRoyale"
copy_file "src/components/BattleRoyale/BattleRoyaleLobby.jsx" "$APP_DIR/src/components/BattleRoyale/"
copy_file "src/components/BattleRoyale/BattleRoyaleGameRoom.jsx" "$APP_DIR/src/components/BattleRoyale/"
copy_file "src/pages/CreateFlip.jsx" "$APP_DIR/src/pages/"
copy_file "src/Routes.jsx" "$APP_DIR/src/"
copy_file "src/services/ContractService.js" "$APP_DIR/src/services/"

# Deploy contract
echo "📤 Deploying contract..."
copy_file "contracts/NFTFlipGame.sol" "$APP_DIR/contracts/"

# Build frontend
echo "🔨 Building frontend..."
execute_remote "cd $APP_DIR && npm run build"

# Restart application
echo "▶️ Starting application..."
execute_remote "cd $APP_DIR && pm2 start ecosystem.config.js"

# Wait and verify
echo "⏳ Waiting for startup..."
sleep 10

echo "📊 Checking status..."
execute_remote "cd $APP_DIR && pm2 status"

echo "🧪 Testing API..."
execute_remote "curl -s http://localhost:3000/api/health | head -1"

echo ""
echo "✅ Battle Royale Deployment Complete!"
echo "🎯 Test at: https://flipnosis.fun/create"
echo "📋 Next: Deploy updated smart contract"
echo ""
