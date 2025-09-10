# Check Deployment Status
# This shows you exactly what's deployed

$DROPLET_IP = "159.69.242.154"

Write-Host "CHECKING DEPLOYMENT STATUS" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

Write-Host "`n1. Current JavaScript files on server:" -ForegroundColor Yellow
ssh root@$DROPLET_IP "ls -la /root/flipnosis-digitalocean/dist/assets/ | grep 'index-.*\.js' | head -5"

Write-Host "`n2. Server process status:" -ForegroundColor Yellow
ssh root@$DROPLET_IP "ps aux | grep node | grep -v grep"

Write-Host "`n3. Server log (last 10 lines):" -ForegroundColor Yellow
ssh root@$DROPLET_IP "tail -n 10 /root/flipnosis-digitalocean/server.log"

Write-Host "`n4. File timestamps:" -ForegroundColor Yellow
ssh root@$DROPLET_IP "ls -la /root/flipnosis-digitalocean/index.html /root/flipnosis-digitalocean/package.json"

Write-Host "`n5. Test server response:" -ForegroundColor Yellow
ssh root@$DROPLET_IP "curl -s http://localhost:3001/health"

Write-Host "`nStatus check complete!" -ForegroundColor Green
