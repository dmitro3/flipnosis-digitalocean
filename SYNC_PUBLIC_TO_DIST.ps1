# Sync Public to Dist - Keep folders in sync
# Run this script whenever you make changes to public/ folder

$ErrorActionPreference = "Stop"

Write-Host "Syncing public/ to dist/..." -ForegroundColor Cyan

# Copy all JS files
Write-Host "Copying JavaScript files..." -ForegroundColor Yellow
Copy-Item -Path "public\js\*" -Destination "dist\js\" -Recurse -Force

# Copy HTML files  
Write-Host "Copying HTML files..." -ForegroundColor Yellow
Copy-Item -Path "public\*.html" -Destination "dist\" -Force

# Copy other assets if needed
# Uncomment if you have other assets to sync:
# Copy-Item -Path "public\images\*" -Destination "dist\images\" -Recurse -Force
# Copy-Item -Path "public\coins\*" -Destination "dist\coins\" -Recurse -Force

Write-Host "Sync complete! All files updated in dist/" -ForegroundColor Green
Write-Host "Hard refresh your browser (Ctrl + Shift + R) to see changes" -ForegroundColor Cyan

