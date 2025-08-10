@echo off
echo 📤 Pushing to GitHub for backup...

echo Adding files to Git...
git add .

echo Committing changes...
git commit -m "Backup: %date% %time% - Server-side game engine updates"

echo Pushing to GitHub...
git push origin main

echo ✅ Successfully pushed to GitHub!
echo 🔗 Check your repository at: https://github.com/AlphaSocial/flipnosis-digitalocean
echo.
echo To deploy to DigitalOcean, run: deploy.bat
pause
