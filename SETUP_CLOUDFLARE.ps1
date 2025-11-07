# One-time setup for Cloudflare API credentials
# This enables automatic cache purging on every deploy

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  CLOUDFLARE CREDENTIALS SETUP" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "This is a ONE-TIME setup to enable automatic cache purging." -ForegroundColor Yellow
Write-Host "Once configured, DEPLOY.ps1 will automatically purge Cloudflare cache.`n" -ForegroundColor Yellow

Write-Host "To get your credentials:" -ForegroundColor Cyan
Write-Host "  1. Go to: https://dash.cloudflare.com" -ForegroundColor White
Write-Host "  2. Select domain: flipnosis.fun" -ForegroundColor White
Write-Host "  3. Zone ID: Look in the right sidebar under 'API'" -ForegroundColor White
Write-Host "  4. API Key: My Profile → API Tokens → Global API Key`n" -ForegroundColor White

# Get credentials
$email = Read-Host "Enter your Cloudflare email"
$apiKey = Read-Host "Enter your Cloudflare Global API Key" -AsSecureString
$apiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey))
$zoneId = Read-Host "Enter your Cloudflare Zone ID"

Write-Host "`nSetting environment variables..." -ForegroundColor Cyan

# Set user-level environment variables
[Environment]::SetEnvironmentVariable('CLOUDFLARE_EMAIL', $email, 'User')
[Environment]::SetEnvironmentVariable('CLOUDFLARE_API_KEY', $apiKeyPlain, 'User')
[Environment]::SetEnvironmentVariable('CLOUDFLARE_ZONE_ID', $zoneId, 'User')

Write-Host "OK: Environment variables set!" -ForegroundColor Green
Write-Host "`nVerifying..." -ForegroundColor Cyan

# Test the credentials
try {
    $headers = @{
        "X-Auth-Email" = $email
        "X-Auth-Key" = $apiKeyPlain
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId" `
        -Method Get `
        -Headers $headers
    
    if ($response.success) {
        Write-Host "OK: Credentials verified successfully!" -ForegroundColor Green
        Write-Host "Zone: $($response.result.name)" -ForegroundColor Green
    } else {
        Write-Warning "Credentials may be incorrect. Please verify."
    }
} catch {
    Write-Warning "Could not verify credentials: $_"
    Write-Host "Please double-check your API key and Zone ID" -ForegroundColor Yellow
}

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

Write-Host "`nYou MUST restart PowerShell for variables to take effect!" -ForegroundColor Yellow
Write-Host "After restarting, run: .\DEPLOY.ps1 'test message'`n" -ForegroundColor Cyan


