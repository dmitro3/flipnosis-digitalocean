# Quick test via direct IP (bypasses Cloudflare)
# Opens browser directly to Hetzner server

$directUrl = "http://159.69.242.154/"

Write-Host "Opening direct server connection..." -ForegroundColor Cyan
Write-Host "URL: $directUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "This bypasses Cloudflare - you'll see changes immediately!" -ForegroundColor Green
Write-Host ""

Start-Process $directUrl





