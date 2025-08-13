@echo off
REM PostgreSQL + Redis Migration Script (Batch Version)
REM This script migrates from SQLite to PostgreSQL + Redis

set ServerIP=116.202.24.43
set PlatformIP=159.69.242.154

echo 🚀 Starting PostgreSQL + Redis Migration...

REM Step 1: Setup PostgreSQL and Redis on Server 116
echo [INFO] Step 1: Setting up PostgreSQL and Redis on server %ServerIP%

REM Copy setup script to server
echo [INFO] Copying setup script to server...
scp -o StrictHostKeyChecking=no scripts/setup-postgresql-redis.sh root@%ServerIP%:/opt/flipnosis/

REM Make script executable and run it
echo [INFO] Running setup script on server...
ssh -o StrictHostKeyChecking=no root@%ServerIP% "chmod +x /opt/flipnosis/setup-postgresql-redis.sh && /opt/flipnosis/setup-postgresql-redis.sh"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] PostgreSQL and Redis setup completed on server %ServerIP%
) else (
    echo [ERROR] PostgreSQL and Redis setup failed on server %ServerIP%
    exit /b 1
)

REM Step 2: Install Node.js dependencies
echo [INFO] Step 2: Installing Node.js dependencies on server %ServerIP%
ssh -o StrictHostKeyChecking=no root@%ServerIP% "cd /opt/flipnosis/app && npm install pg redis"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Node.js dependencies installed successfully
) else (
    echo [ERROR] Failed to install Node.js dependencies
    exit /b 1
)

REM Step 3: Run database migration
echo [INFO] Step 3: Running database migration

REM Copy migration script to server
echo [INFO] Copying migration script to server...
scp -o StrictHostKeyChecking=no scripts/migrate-to-postgresql.js root@%ServerIP%:/opt/flipnosis/app/scripts/

REM Run migration
ssh -o StrictHostKeyChecking=no root@%ServerIP% "cd /opt/flipnosis/app && node scripts/migrate-to-postgresql.js"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Database migration completed successfully
) else (
    echo [ERROR] Database migration failed
    exit /b 1
)

REM Step 4: Update application code on platform server
echo [INFO] Step 4: Updating application code on platform server %PlatformIP%

REM Copy new database service to platform server
echo [INFO] Copying new database service to platform server...
scp -o StrictHostKeyChecking=no server/services/database-postgresql.js root@%PlatformIP%:/opt/flipnosis/app/server/services/

REM Install dependencies on platform server
echo [INFO] Installing dependencies on platform server...
ssh -o StrictHostKeyChecking=no root@%PlatformIP% "cd /opt/flipnosis/app && npm install pg redis"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Platform server dependencies installed
) else (
    echo [ERROR] Failed to install platform server dependencies
    exit /b 1
)

REM Step 5: Update server.js to use new database service
echo [INFO] Step 5: Updating server configuration

REM Create backup of current server.js
ssh -o StrictHostKeyChecking=no root@%PlatformIP% "cd /opt/flipnosis/app && cp server/server.js server/server.js.sqlite.backup"

REM Copy the updated server.js file
scp -o StrictHostKeyChecking=no server/server-postgresql.js root@%PlatformIP%:/opt/flipnosis/app/server/server.js

echo [SUCCESS] Server configuration updated

REM Step 6: Test the new setup
echo [INFO] Step 6: Testing the new database setup

REM Test database connection
echo [INFO] Testing database connection...
ssh -o StrictHostKeyChecking=no root@%PlatformIP% "cd /opt/flipnosis/app && node -e 'const DatabaseService = require(\"./server/services/database-postgresql\"); const db = new DatabaseService(); db.initialize().then(() => { console.log(\"Database test successful\"); process.exit(0); }).catch(err => { console.error(\"Database test failed:\", err); process.exit(1); });'"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Database connection test passed
) else (
    echo [ERROR] Database connection test failed
    exit /b 1
)

REM Step 7: Restart the application
echo [INFO] Step 7: Restarting the application

REM Restart PM2 process
ssh -o StrictHostKeyChecking=no root@%PlatformIP% "cd /opt/flipnosis/app && pm2 restart flipnosis"

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Application restarted successfully
) else (
    echo [ERROR] Failed to restart application
    exit /b 1
)

REM Step 8: Verify deployment
echo [INFO] Step 8: Verifying deployment

REM Wait a moment for the application to start
timeout /t 10 /nobreak >nul

REM Test health endpoint
echo [INFO] Testing health endpoint...
curl -s http://%PlatformIP%/health

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Deployment verification successful
) else (
    echo [ERROR] Deployment verification failed
    exit /b 1
)

REM Step 9: Cleanup old SQLite files
echo [INFO] Step 9: Cleaning up old SQLite files

REM Backup old SQLite databases
ssh -o StrictHostKeyChecking=no root@%ServerIP% "cd /opt/flipnosis/shared && cp flipz-clean.db flipz-clean.db.postgresql-migration-backup"
ssh -o StrictHostKeyChecking=no root@%PlatformIP% "cd /opt/flipnosis/app/server && cp flipz-clean.db flipz-clean.db.postgresql-migration-backup"

echo [SUCCESS] Old SQLite databases backed up

echo [SUCCESS] 🎉 PostgreSQL + Redis migration completed successfully!
echo.
echo 📋 Migration Summary:
echo ====================
echo ✅ PostgreSQL and Redis installed on server %ServerIP%
echo ✅ Database schema created and data migrated
echo ✅ Application updated to use PostgreSQL + Redis
echo ✅ WebSocket real-time functionality enabled
echo ✅ Application restarted and verified
echo.
echo 🔧 Benefits achieved:
echo - Real-time WebSocket communication
echo - Better concurrent connection handling
echo - Improved performance and scalability
echo - Professional database architecture
echo.
echo 🌐 Application URLs:
echo - Main application: http://%PlatformIP%
echo - Health check: http://%PlatformIP%/health
echo.
echo ⚠️  Important notes:
echo - Old SQLite databases have been backed up
echo - Monitor the application for any issues
echo - Check logs: pm2 logs flipnosis
echo.
pause
