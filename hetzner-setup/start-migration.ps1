# Hetzner Migration Starter Script for Windows
# This script will help you start the migration process

Write-Host "🚀 Welcome to the Hetzner Migration Guide!" -ForegroundColor Green
Write-Host "This will save you 85% on hosting costs and give you better performance!" -ForegroundColor Green
Write-Host ""

Write-Host "=== STEP 1: HETZNER ACCOUNT SETUP ===" -ForegroundColor Magenta
Write-Host "1. Go to https://console.hetzner.cloud/" -ForegroundColor Blue
Write-Host "2. Create account and verify email"
Write-Host "3. Add payment method"
Write-Host "4. Get €20 free credit"
Write-Host ""

$continue = Read-Host "Press Enter when you have created your Hetzner account..."

Write-Host "=== STEP 2: CREATE YOUR SERVERS ===" -ForegroundColor Magenta
Write-Host "You need to create 2 servers:" -ForegroundColor Blue
Write-Host ""
Write-Host "DATABASE SERVER:"
Write-Host "- Location: Germany (Falkenstein)"
Write-Host "- Type: CX21 (4GB RAM, 2 vCPU, 40GB SSD)"
Write-Host "- Cost: €5.83/month"
Write-Host "- OS: Ubuntu 22.04 LTS"
Write-Host "- Name: flipnosis-db"
Write-Host ""
Write-Host "APPLICATION SERVER:"
Write-Host "- Location: Germany (Falkenstein)"
Write-Host "- Type: CX21 (4GB RAM, 2 vCPU, 40GB SSD)"
Write-Host "- Cost: €5.83/month"
Write-Host "- OS: Ubuntu 22.04 LTS"
Write-Host "- Name: flipnosis-app"
Write-Host ""

$continue = Read-Host "Press Enter when you have created both servers..."

Write-Host "=== STEP 3: GET SERVER IP ADDRESSES ===" -ForegroundColor Magenta
$dbServerIP = Read-Host "Enter Database Server IP"
$appServerIP = Read-Host "Enter Application Server IP"

Write-Host ""
Write-Host "✅ Database Server IP: $dbServerIP" -ForegroundColor Green
Write-Host "✅ Application Server IP: $appServerIP" -ForegroundColor Green
Write-Host ""

Write-Host "=== STEP 4: START MIGRATION ===" -ForegroundColor Magenta
Write-Host "Now we'll start the migration process..." -ForegroundColor Blue
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Please run this script from your project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found package.json - we're in the right directory" -ForegroundColor Green
Write-Host ""

Write-Host "=== STEP 5: RUN MIGRATION SCRIPT ===" -ForegroundColor Magenta
Write-Host "The migration script will:" -ForegroundColor Blue
Write-Host "- Backup your current data"
Write-Host "- Set up PostgreSQL database"
Write-Host "- Migrate all your data"
Write-Host "- Create deployment package"
Write-Host "- Give you deployment instructions"
Write-Host ""

$runMigration = Read-Host "Do you want to run the migration script now? (y/n)"

if ($runMigration -eq "y" -or $runMigration -eq "Y") {
    Write-Host "🚀 Starting migration..." -ForegroundColor Green
    
    # Check if WSL is available
    if (Get-Command wsl -ErrorAction SilentlyContinue) {
        Write-Host "✅ WSL detected - running migration script..." -ForegroundColor Green
        wsl bash ./hetzner-setup/quick-migrate.sh
    } else {
        Write-Host "⚠️  WSL not detected" -ForegroundColor Yellow
        Write-Host "You'll need to run the migration script on a Linux system or WSL" -ForegroundColor Yellow
        Write-Host "The script is located at: ./hetzner-setup/quick-migrate.sh" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Alternative: Use the manual setup instructions in the checklist" -ForegroundColor Blue
    }
} else {
    Write-Host "⏭️  Skipping automatic migration" -ForegroundColor Yellow
    Write-Host "You can run the migration script manually later" -ForegroundColor Blue
}

Write-Host ""
Write-Host "=== STEP 6: NEXT STEPS ===" -ForegroundColor Magenta
Write-Host "After migration, you'll need to:" -ForegroundColor Blue
Write-Host "1. Set up Cloudflare for your domain"
Write-Host "2. Update DNS records"
Write-Host "3. Test thoroughly"
Write-Host "4. Switch traffic from DigitalOcean"
Write-Host ""

Write-Host "💰 Cost Savings: 85% cheaper than DigitalOcean" -ForegroundColor Green
Write-Host "🚀 Benefits: Better performance, separated database, global CDN" -ForegroundColor Green
Write-Host ""

Write-Host "Check the HETZNER_MIGRATION_CHECKLIST.md file for detailed instructions" -ForegroundColor Blue
Write-Host "Good luck with your migration! 🎉" -ForegroundColor Green
