# Clear Cache and Force Fresh Deployment
# This script clears all caches and forces a fresh deployment

$DROPLET_IP = "143.198.166.196"

Write-Host "Clearing server cache and forcing fresh deployment..." -ForegroundColor Green

# Clear server cache and restart
$clearCommand = @"
cd /root/flipnosis-digitalocean && 
pkill -f 'node.*server.js' && 
sleep 2 && 
rm -rf node_modules && 
rm -rf dist && 
rm package-lock.json && 
npm install && 
npm run build && 
nohup node server/server.js > server.log 2>&1 & && 
systemctl restart nginx && 
echo 'Cache cleared and fresh deployment completed!'
"@

ssh root@$DROPLET_IP $clearCommand

Write-Host "Cache cleared! Please hard refresh your browser (Ctrl+F5)" -ForegroundColor Green
