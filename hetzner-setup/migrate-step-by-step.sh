#!/bin/bash

# Step-by-Step Hetzner Migration Guide
# This script will guide you through the complete migration process

set -e

echo "🚀 Welcome to the Hetzner Migration Guide!"
echo "This will save you 85% on hosting costs and give you better performance!"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_step() {
    echo -e "${PURPLE}=== STEP $1 ===${NC}"
    echo -e "${BLUE}$2${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Account Setup
print_step "1" "HETZNER ACCOUNT SETUP"
echo "1. Go to https://console.hetzner.cloud/"
echo "2. Create account and verify email"
echo "3. Add payment method"
echo "4. Get €20 free credit"
echo ""
read -p "Press Enter when you have created your Hetzner account..."

# Step 2: Server Creation
print_step "2" "CREATE YOUR SERVERS"
echo "You need to create 2 servers:"
echo ""
echo "DATABASE SERVER:"
echo "- Location: Germany (Falkenstein)"
echo "- Type: CX21 (4GB RAM, 2 vCPU, 40GB SSD)"
echo "- Cost: €5.83/month"
echo "- OS: Ubuntu 22.04 LTS"
echo "- Name: flipnosis-db"
echo ""
echo "APPLICATION SERVER:"
echo "- Location: Germany (Falkenstein)"
echo "- Type: CX21 (4GB RAM, 2 vCPU, 40GB SSD)"
echo "- Cost: €5.83/month"
echo "- OS: Ubuntu 22.04 LTS"
echo "- Name: flipnosis-app"
echo ""
read -p "Press Enter when you have created both servers..."

# Step 3: Get Server IPs
print_step "3" "GET SERVER IP ADDRESSES"
echo "Please provide the IP addresses of your servers:"
echo ""
read -p "Enter Database Server IP: " DB_SERVER_IP
read -p "Enter Application Server IP: " APP_SERVER_IP

echo ""
print_success "Database Server IP: $DB_SERVER_IP"
print_success "Application Server IP: $APP_SERVER_IP"
echo ""

# Step 4: Database Setup
print_step "4" "SETUP DATABASE SERVER"
echo "Now we'll set up the database server..."
echo ""

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32)
echo "Generated secure database password: $DB_PASSWORD"
echo ""

print_info "Setting up PostgreSQL on database server..."
print_info "SSH into your database server: ssh root@$DB_SERVER_IP"
echo ""

# Create database setup script
cat > setup-database.sh << EOF
#!/bin/bash
# Database setup script for Hetzner

set -e

echo "🗄️  Setting up PostgreSQL database..."

# Update system
apt-get update
apt-get upgrade -y

# Install PostgreSQL
apt-get install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database user and database
sudo -u postgres psql << 'SQL'
CREATE USER flipnosis_user WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE flipnosis OWNER flipnosis_user;
GRANT ALL PRIVILEGES ON DATABASE flipnosis TO flipnosis_user;
\q
SQL

# Configure PostgreSQL for remote connections
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf

# Configure pg_hba.conf for remote connections
echo "host    flipnosis        flipnosis_user    0.0.0.0/0               md5" >> /etc/postgresql/*/main/pg_hba.conf

# Restart PostgreSQL
systemctl restart postgresql

# Configure firewall
ufw allow 22/tcp
ufw allow 5432/tcp
ufw --force enable

echo "✅ Database server setup complete!"
echo "Database: flipnosis"
echo "User: flipnosis_user"
echo "Password: $DB_PASSWORD"
echo "Port: 5432"
EOF

chmod +x setup-database.sh

print_info "Created database setup script: setup-database.sh"
print_info "Copy this script to your database server and run it"
echo ""

# Step 5: Application Setup
print_step "5" "SETUP APPLICATION SERVER"
echo "Now we'll set up the application server..."
echo ""

# Create application setup script
cat > setup-application.sh << EOF
#!/bin/bash
# Application setup script for Hetzner

set -e

echo "🚀 Setting up application server..."

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install nginx
apt-get install -y nginx

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "✅ Application server setup complete!"
EOF

chmod +x setup-application.sh

print_info "Created application setup script: setup-application.sh"
print_info "Copy this script to your application server and run it"
echo ""

# Step 6: Migration Instructions
print_step "6" "MIGRATION INSTRUCTIONS"
echo "Now follow these steps:"
echo ""
echo "1. SSH into database server:"
echo "   ssh root@$DB_SERVER_IP"
echo "   Copy and run: setup-database.sh"
echo ""
echo "2. SSH into application server:"
echo "   ssh root@$APP_SERVER_IP"
echo "   Copy and run: setup-application.sh"
echo ""
echo "3. Run the database migration:"
echo "   ./hetzner-setup/database-migration.sh"
echo ""
echo "4. Deploy the application:"
echo "   ./hetzner-setup/application-deploy.sh"
echo ""

# Step 7: Environment Configuration
print_step "7" "CONFIGURE ENVIRONMENT"
echo "Update your environment variables:"
echo ""
echo "Database URL: postgresql://flipnosis_user:$DB_PASSWORD@$DB_SERVER_IP:5432/flipnosis"
echo ""
echo "Application Server: $APP_SERVER_IP"
echo ""

# Step 8: Cloudflare Setup
print_step "8" "CLOUDFLARE SETUP"
echo "Configure Cloudflare for your domain:"
echo "1. Add your domain to Cloudflare"
echo "2. Update nameservers"
echo "3. Create A record pointing to: $APP_SERVER_IP"
echo "4. Enable SSL/TLS encryption"
echo "5. Enable DDoS protection"
echo ""

print_success "Migration plan complete!"
echo ""
echo "💰 Cost Savings:"
echo "   Current DigitalOcean: ~$48/month"
echo "   New Hetzner: €11.66/month (~$12.80)"
echo "   Savings: 85% cheaper!"
echo ""
echo "🚀 Benefits:"
echo "   - Separated database and application"
echo "   - Better performance and reliability"
echo "   - Global CDN with Cloudflare"
echo "   - Easy scaling and maintenance"
echo ""
echo "Ready to start? Let me know when you've completed each step!"
