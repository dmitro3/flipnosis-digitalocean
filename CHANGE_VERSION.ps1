# Quick script to update version number for cache-busting
# Usage: .\CHANGE_VERSION.ps1 "newversion"
# Example: .\CHANGE_VERSION.ps1 "888"
# Example: .\CHANGE_VERSION.ps1 "20251108" (date-based)

param(
    [Parameter(Mandatory=$true)]
    [string]$newVersion
)

$oldVersion = "777PINK"
$files = @(
    "public/test-tubes.html",
    "public/js/init.js",
    "public/js/game-main.js",
    "public/js/systems/coin-manager.js"
)

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  UPDATING VERSION FOR CACHE-BUSTING" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "Old version: $oldVersion" -ForegroundColor Yellow
Write-Host "New version: $newVersion`n" -ForegroundColor Green

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $newContent = $content -replace "v=$oldVersion", "v=$newVersion"
        Set-Content $file $newContent -NoNewline
        Write-Host "✅ Updated: $file" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Version updated from $oldVersion to $newVersion!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor White
Write-Host "  1. .\DEPLOY.ps1 `"updated to v$newVersion`"" -ForegroundColor White
Write-Host "  2. .\OPEN_DIRECT_IP.ps1`n" -ForegroundColor White




