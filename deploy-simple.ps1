# Simple Deployment Script for Flipnosis.fun
# This script will help you deploy with the fixed Dockerfile

Write-Host "🚀 Simple Flipnosis Deployment Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

Write-Host "`n📋 The deployment failed due to canvas dependency issues." -ForegroundColor Yellow
Write-Host "I've created a simpler Dockerfile that avoids this problem." -ForegroundColor White

Write-Host "`n📋 Commands to run on your DigitalOcean droplet:" -ForegroundColor Yellow

Write-Host "`n# 1. Navigate to the deployment directory" -ForegroundColor Cyan
Write-Host "cd /root/flipnosis-digitalocean/digitalocean-deploy" -ForegroundColor White

Write-Host "`n# 2. Stop any running containers" -ForegroundColor Cyan
Write-Host "docker-compose down" -ForegroundColor White

Write-Host "`n# 3. Clean up Docker cache" -ForegroundColor Cyan
Write-Host "docker system prune -f" -ForegroundColor White

Write-Host "`n# 4. Build and start with the simple Dockerfile" -ForegroundColor Cyan
Write-Host "docker-compose up -d --build" -ForegroundColor White

Write-Host "`n# 5. Check if containers are running" -ForegroundColor Cyan
Write-Host "docker-compose ps" -ForegroundColor White

Write-Host "`n# 6. Check logs if there are issues" -ForegroundColor Cyan
Write-Host "docker-compose logs app" -ForegroundColor White

Write-Host "`n# 7. Test the application" -ForegroundColor Cyan
Write-Host "curl http://localhost/health" -ForegroundColor White

Write-Host "`n🎯 Expected Results:" -ForegroundColor Yellow
Write-Host "After successful deployment:" -ForegroundColor White
Write-Host "- ✅ http://143.198.166.196 should load your application" -ForegroundColor Green
Write-Host "- ✅ https://www.flipnosis.fun should load your application" -ForegroundColor Green

Write-Host "`n🔍 If you still have issues:" -ForegroundColor Yellow
Write-Host "docker-compose logs app" -ForegroundColor White
Write-Host "docker-compose logs nginx" -ForegroundColor White

Write-Host "`n🎉 Ready to deploy!" -ForegroundColor Green
Write-Host "Run the commands above on your DigitalOcean droplet." -ForegroundColor White
