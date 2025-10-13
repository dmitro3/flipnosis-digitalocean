# Diagnose Socket.io WebSocket Connection Issues
# This script checks the current state of nginx and the Node.js server

Write-Host "🔍 Diagnosing Socket.io Connection Issues..." -ForegroundColor Cyan
Write-Host ""

$sshHost = "root@159.69.242.154"

Write-Host "1️⃣ Checking if nginx is running..." -ForegroundColor Yellow
$nginxStatus = ssh $sshHost "systemctl status nginx | head -n 5"
Write-Host $nginxStatus
Write-Host ""

Write-Host "2️⃣ Checking nginx configuration..." -ForegroundColor Yellow
$nginxConfig = ssh $sshHost 'cat /etc/nginx/sites-enabled/flipnosis.fun 2>/dev/null || echo "Config file not found"'
Write-Host $nginxConfig
Write-Host ""

Write-Host "3️⃣ Checking if port 3000 is listening..." -ForegroundColor Yellow
$port3000 = ssh $sshHost 'netstat -tulpn | grep 3000 || echo "Port 3000 not listening"'
Write-Host $port3000
Write-Host ""

Write-Host "4️⃣ Checking Node.js/PM2 processes..." -ForegroundColor Yellow
$pm2List = ssh $sshHost "pm2 list"
Write-Host $pm2List
Write-Host ""

Write-Host "5️⃣ Checking recent server logs..." -ForegroundColor Yellow
$serverLogs = ssh $sshHost 'pm2 logs flipnosis --nostream --lines 30 2>/dev/null || echo "No PM2 logs found"'
Write-Host $serverLogs
Write-Host ""

Write-Host "6️⃣ Testing Socket.io endpoint directly..." -ForegroundColor Yellow
$socketTest = ssh $sshHost 'curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/socket.io/?EIO=4`&transport=polling"'
Write-Host "Local Socket.io test (should be 200): $socketTest"
Write-Host ""

Write-Host "7️⃣ Checking nginx error logs..." -ForegroundColor Yellow
$nginxErrors = ssh $sshHost 'tail -n 20 /var/log/nginx/error.log 2>/dev/null || echo "No nginx error logs"'
Write-Host $nginxErrors
Write-Host ""

Write-Host "8️⃣ Checking firewall status..." -ForegroundColor Yellow
$firewallStatus = ssh $sshHost 'ufw status || iptables -L -n | head -n 20'
Write-Host $firewallStatus
Write-Host ""

Write-Host "📊 Diagnosis Summary:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

if ($port3000 -match "3000") {
    Write-Host "✅ Node.js server is listening on port 3000" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js server is NOT listening on port 3000" -ForegroundColor Red
    Write-Host "   → Run: ssh $sshHost 'pm2 restart flipnosis'" -ForegroundColor Yellow
}

if ($nginxStatus -match "active") {
    Write-Host "✅ Nginx is running" -ForegroundColor Green
} else {
    Write-Host "❌ Nginx is not running properly" -ForegroundColor Red
    Write-Host "   → Run: ssh $sshHost 'systemctl restart nginx'" -ForegroundColor Yellow
}

if ($nginxConfig -match "/socket.io/") {
    Write-Host "✅ Nginx has Socket.io configuration" -ForegroundColor Green
} else {
    Write-Host "❌ Nginx is missing Socket.io configuration" -ForegroundColor Red
    Write-Host "   → Run: .\fix-socketio-connection-final.ps1" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🛠️ Quick Fixes:" -ForegroundColor Cyan
Write-Host "   1. Apply nginx fix:      .\fix-socketio-connection-final.ps1" -ForegroundColor White
Write-Host "   2. Restart server:       ssh $sshHost 'pm2 restart flipnosis'" -ForegroundColor White
Write-Host "   3. View live logs:       ssh $sshHost 'pm2 logs flipnosis'" -ForegroundColor White
Write-Host "   4. Check nginx logs:     ssh $sshHost 'tail -f /var/log/nginx/error.log'" -ForegroundColor White

