@echo off
echo 🚀 Deploying to DigitalOcean...

echo 📤 Pushing to GitHub...
git add .
git commit -m "Auto-deploy: %date% %time%"
git push origin main

echo 🔧 Deploying to DigitalOcean...
ssh root@143.198.166.196 "cd /root/flipnosis-digitalocean && git pull origin main && cd digitalocean-deploy && docker-compose down && docker-compose build --no-cache && docker-compose up -d && docker-compose exec app node scripts/migrate-database-schema.js || true"

echo ✅ Deployment completed!
echo 🌐 Your app is available at: http://143.198.166.196
pause
