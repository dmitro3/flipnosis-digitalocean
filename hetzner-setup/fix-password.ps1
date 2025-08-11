# Fix Password Script for Hetzner Migration
# This script will generate a simpler password and update all files

Write-Host "🔧 Fixing password compatibility issue..." -ForegroundColor Green
Write-Host ""

# Generate a simpler, more compatible password (alphanumeric only)
$DBPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "New database password: $DBPassword" -ForegroundColor Yellow
Write-Host ""

# Server IPs
$DatabaseServerIP = "116.202.24.43"
$ApplicationServerIP = "159.69.242.154"

# Update environment file
Write-Host "Updating environment file..." -ForegroundColor Blue
$envContent = "DATABASE_URL=postgresql://flipnosis_user:$DBPassword@$DatabaseServerIP:5432/flipnosis`n"
$envContent += "CONTRACT_ADDRESS=0x3997F4720B3a515e82d54F30d7CF2993B014EeBE`n"
$envContent += "CONTRACT_OWNER_KEY=f19dd56173918d384a2ff2d73905ebc666034b6abd34312a074b4a80ddb2e80c`n"
$envContent += "RPC_URL=https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3`n"
$envContent += "PORT=3000`n"
$envContent += "NODE_ENV=production`n"
$envContent += "VITE_ALCHEMY_API_KEY=hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3`n"
$envContent += "VITE_PLATFORM_FEE_RECEIVER=0x47d80671bcb7ec368ef4d3ca6e1c20173ccc9a28"

$envContent | Out-File -FilePath ".env.hetzner" -Encoding UTF8
Write-Host "✅ Environment file updated" -ForegroundColor Green

# Update deployment package environment file
$deployDir = Get-ChildItem -Name "hetzner-deploy-*" | Sort-Object | Select-Object -Last 1
if ($deployDir) {
    $envContent | Out-File -FilePath "$deployDir/.env" -Encoding UTF8
    Write-Host "✅ Deployment package environment updated" -ForegroundColor Green
}

# Update database setup script
Write-Host "Updating database setup script..." -ForegroundColor Blue
$dbSetupContent = @"
#!/bin/bash
set -e
echo "Setting up PostgreSQL database..."
apt-get update
apt-get install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
sudo -u postgres psql << 'SQL'
CREATE USER flipnosis_user WITH PASSWORD '$DBPassword';
CREATE DATABASE flipnosis OWNER flipnosis_user;
GRANT ALL PRIVILEGES ON DATABASE flipnosis TO flipnosis_user;
\q
SQL
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
echo "host    flipnosis        flipnosis_user    0.0.0.0/0               md5" >> /etc/postgresql/*/main/pg_hba.conf
systemctl restart postgresql
ufw allow 22/tcp
ufw allow 5432/tcp
ufw --force enable
echo "Database setup complete!"
echo "Database: flipnosis"
echo "User: flipnosis_user"
echo "Password: $DBPassword"
echo "Port: 5432"
"@

$dbSetupContent | Out-File -FilePath "setup-database.sh" -Encoding UTF8
Write-Host "✅ Database setup script updated" -ForegroundColor Green

# Create a simple test script
Write-Host "Creating database test script..." -ForegroundColor Blue
$testScript = @"
#!/bin/bash
echo "Testing database connection..."
PGPASSWORD='$DBPassword' psql -h $DatabaseServerIP -U flipnosis_user -d flipnosis -c "SELECT version();"
echo "Database connection successful!"
"@

$testScript | Out-File -FilePath "test-database.sh" -Encoding UTF8
Write-Host "✅ Database test script created" -ForegroundColor Green

Write-Host ""
Write-Host "=== UPDATED MIGRATION INSTRUCTIONS ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. SSH into database server:" -ForegroundColor Cyan
Write-Host "   ssh root@$DatabaseServerIP"
Write-Host "   Copy and run: setup-database.sh"
Write-Host ""
Write-Host "2. SSH into application server:" -ForegroundColor Cyan
Write-Host "   ssh root@$ApplicationServerIP"
Write-Host "   Copy and run: setup-application.sh"
Write-Host ""
Write-Host "3. Copy deployment package:" -ForegroundColor Cyan
Write-Host "   scp -r $deployDir root@$ApplicationServerIP:/root/"
Write-Host ""
Write-Host "4. Deploy application:" -ForegroundColor Cyan
Write-Host "   ssh root@$ApplicationServerIP"
Write-Host "   cd $deployDir"
Write-Host "   npm install"
Write-Host "   npm start"
Write-Host ""
Write-Host "5. Test the application:" -ForegroundColor Cyan
Write-Host "   curl http://$ApplicationServerIP"
Write-Host ""

Write-Host "✅ Password fix completed!" -ForegroundColor Green
Write-Host ""
Write-Host "New Database Password: $DBPassword" -ForegroundColor Red
Write-Host "This password should work better with PostgreSQL" -ForegroundColor Green
