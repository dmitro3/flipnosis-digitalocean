# Socket.io Connection Test Script
# This script tests if the Socket.io deployment is working

$PRODUCTION_IP = "159.69.242.154"

Write-Host "🧪 Testing Socket.io Deployment" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Test 1: Check if server is running
Write-Host "🔍 Testing server status..." -ForegroundColor Blue
ssh root@$PRODUCTION_IP "ps aux | grep 'node.*server.js' | grep -v grep"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Server is running" -ForegroundColor Green
} else {
    Write-Host "❌ Server is not running" -ForegroundColor Red
    exit 1
}

# Test 2: Check if Socket.io dependencies are installed
Write-Host "🔍 Checking Socket.io dependencies..." -ForegroundColor Blue
ssh root@$PRODUCTION_IP "cd /var/www/flipnosis && npm list socket.io socket.io-client"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Socket.io dependencies are installed" -ForegroundColor Green
} else {
    Write-Host "❌ Socket.io dependencies are missing" -ForegroundColor Red
    exit 1
}

# Test 3: Check server logs for Socket.io initialization
Write-Host "🔍 Checking server logs for Socket.io..." -ForegroundColor Blue
ssh root@$PRODUCTION_IP "cd /var/www/flipnosis && tail -20 server.log | grep -i socket"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Socket.io initialization found in logs" -ForegroundColor Green
} else {
    Write-Host "⚠️ Socket.io initialization not found in logs" -ForegroundColor Yellow
}

# Test 4: Test HTTP endpoint
Write-Host "🔍 Testing HTTP endpoint..." -ForegroundColor Blue
$response = Invoke-WebRequest -Uri "https://flipnosis.fun/health" -UseBasicParsing
if ($response.StatusCode -eq 200) {
    Write-Host "✅ HTTP endpoint is responding" -ForegroundColor Green
    $healthData = $response.Content | ConvertFrom-Json
    Write-Host "📊 Health status: $($healthData.status)" -ForegroundColor Cyan
    Write-Host "📊 Socket.io status: $($healthData.socketio)" -ForegroundColor Cyan
} else {
    Write-Host "❌ HTTP endpoint is not responding" -ForegroundColor Red
}

# Test 5: Test Socket.io connection (basic)
Write-Host "🔍 Testing Socket.io connection..." -ForegroundColor Blue
Write-Host "⚠️ Manual test required: Open https://flipnosis.fun in browser" -ForegroundColor Yellow
Write-Host "⚠️ Check browser console for Socket.io connection logs" -ForegroundColor Yellow

Write-Host "🎉 Socket.io deployment test completed!" -ForegroundColor Green
Write-Host "🔗 Test the live connection at https://flipnosis.fun" -ForegroundColor Yellow
