# Check Deployment Status Script
# This script checks if your deployment is working correctly

$DROPLET_IP = "143.198.166.196"

Write-Host "🔍 Checking Deployment Status" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

Write-Host "`n1. Checking if Node.js process is running..." -ForegroundColor Yellow
ssh root@$DROPLET_IP "ps aux | grep node | grep -v grep"

Write-Host "`n2. Checking the application directory..." -ForegroundColor Yellow
ssh root@$DROPLET_IP "ls -la /root/flipnosis-digitalocean/"

Write-Host "`n3. Checking if the server is responding..." -ForegroundColor Yellow
ssh root@$DROPLET_IP "curl -s http://localhost:3001/health || echo 'Server not responding'"

Write-Host "`n4. Checking nginx status..." -ForegroundColor Yellow
ssh root@$DROPLET_IP "systemctl status nginx --no-pager -l"

Write-Host "`n5. Checking recent log entries..." -ForegroundColor Yellow
ssh root@$DROPLET_IP "tail -n 10 /var/log/nginx/access.log"

Write-Host "`n6. Testing the domain..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://www.flipnosis.fun" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Domain is responding with status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Domain is not responding: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Deployment check completed!" -ForegroundColor Green
