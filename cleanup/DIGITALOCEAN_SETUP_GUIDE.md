# 🚀 DigitalOcean Migration Setup Guide - Flipnosis NFT Game

## 📋 **CURRENT STATUS - AUGUST 7, 2025**

### ✅ **COMPLETED STEPS:**
1. ✅ DigitalOcean account created
2. ✅ Droplet deployed (143.198.166.196)
3. ✅ Docker and Docker Compose installed
4. ✅ Application code deployed
5. ✅ Database configured and working
6. ✅ Application container running (port 3000)
7. ✅ Environment variables configured

### 🚨 **CURRENT ISSUE:**
**Nginx SSL Certificate Error** - The nginx container is failing to start because it's looking for SSL certificates that don't exist:
```
nginx: [emerg] cannot load certificate "/etc/nginx/ssl/cert.pem": BIO_new_file() failed
```

### 🎯 **IMMEDIATE NEXT STEPS:**
1. **Fix SSL Certificate Issue** (Priority 1)
2. **Get Nginx Running** (Priority 2)
3. **Test External Access** (Priority 3)
4. **Configure Domain** (Priority 4)

---

## 🚨 **URGENT: FIX SSL CERTIFICATE ISSUE**

### Option A: Use HTTP Only (Quick Fix)
Replace the current nginx.conf with a simple HTTP-only configuration:

```bash
# On your DigitalOcean droplet
cd ~/flipnosis-digitalocean/digitalocean-deploy
nano nginx/nginx.conf
```

**Replace entire content with:**
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Upstream for app
    upstream app {
        server app:3000;
    }

    # HTTP server
    server {
        listen 80;
        server_name _;

        # WebSocket connections
        location /ws {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400;
            proxy_send_timeout 86400;
        }

        # API routes
        location /api/ {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Main application
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### Option B: Generate Self-Signed SSL (Better)
```bash
# Create SSL directory
mkdir -p nginx/ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=143.198.166.196"
```

### Restart Services
```bash
# Restart containers
docker-compose down
docker-compose up -d

# Check status
docker-compose ps
curl http://localhost/health
```

---

## 📋 **MIGRATION OVERVIEW**

This guide will help you migrate your NFT flip game from Railway to DigitalOcean, taking advantage of the 60-day free trial with $200 credit.

### 🎯 **Key Benefits:**
- **60 days completely free** ($200 credit)
- **Separate managed database** (persistent across deployments)
- **Professional infrastructure** with automatic backups
- **Better performance** for USA users
- **Cost-effective** long-term solution

---

## 🏗️ **PHASE 1: DIGITALOCEAN INFRASTRUCTURE SETUP**

### Step 1: Create DigitalOcean Account
1. Go to [DigitalOcean.com](https://digitalocean.com)
2. Sign up for a new account
3. Add payment method (required for $200 credit)
4. Verify your account

### Step 2: Create Droplet (Server)
1. **Droplet Type**: Ubuntu 22.04 LTS
2. **Size**: 4 vCPU, 8GB RAM, 160GB SSD ($40/month)
3. **Region**: NYC1 (New York) for best USA performance
4. **Authentication**: SSH Key (recommended) or Password
5. **Hostname**: `flipnosis-game-server`

### Step 3: Create Managed PostgreSQL Database
1. Go to **Databases** → **Create Database Cluster**
2. **Engine**: PostgreSQL 15
3. **Size**: Basic ($15/month)
4. **Region**: NYC1 (same as droplet)
5. **Database Name**: `flipnosis_production`
6. **Username**: `flipnosis_user`
7. **Password**: Generate strong password
8. **Trusted Sources**: Add your droplet's IP

### Step 4: Configure Firewall
1. Go to **Networking** → **Firewalls**
2. Create new firewall: `flipnosis-firewall`
3. **Inbound Rules**:
   - HTTP (80) - All IPv4, IPv6
   - HTTPS (443) - All IPv4, IPv6
   - SSH (22) - Your IP only
4. **Outbound Rules**: All traffic
5. Apply to your droplet

---

## 🔧 **PHASE 2: SERVER SETUP**

### Step 1: Connect to Your Droplet
```bash
ssh root@your-droplet-ip
```

### Step 2: Update System
```bash
apt update && apt upgrade -y
```

### Step 3: Install Docker and Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Add user to docker group
usermod -aG docker $USER
```

### Step 4: Create Application Directory
```bash
mkdir -p /opt/flipnosis
cd /opt/flipnosis
```

### Step 5: Clone Your Repository
```bash
git clone https://github.com/your-username/flipnosis.git .
```

---

## 🗄️ **PHASE 3: DATABASE MIGRATION**

### Step 1: Export Current Data (from Railway)
```bash
# On your local machine or Railway
pg_dump $RAILWAY_DATABASE_URL > flipnosis_backup.sql
```

### Step 2: Import to DigitalOcean PostgreSQL
```bash
# Get connection details from DigitalOcean dashboard
psql "postgresql://flipnosis_user:password@host:port/flipnosis_production" < flipnosis_backup.sql
```

### Step 3: Update Database Schema (if needed)
```sql
-- Run any necessary schema updates
-- Your current schema should work as-is
```

---

## ⚙️ **PHASE 4: APPLICATION CONFIGURATION**

### Step 1: Create Environment File
```bash
cd /opt/flipnosis/digitalocean-deploy
cp env-template.txt .env
nano .env
```

### Step 2: Configure Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://flipnosis_user:your_password@host:port/flipnosis_production

# Blockchain Configuration
CONTRACT_ADDRESS=0x6527c1e6b12cd0F6d354B15CF7935Dc5516DEcaf
CONTRACT_OWNER_KEY=your_private_key_here
RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_alchemy_key

# Security
JWT_SECRET=your_secure_jwt_secret_here
SESSION_SECRET=your_secure_session_secret_here
```

### Step 3: Make Scripts Executable
```bash
chmod +x scripts/deploy.sh
chmod +x scripts/backup.sh
```

---

## 🚀 **PHASE 5: DEPLOYMENT**

### Step 1: Initial Deployment
```bash
cd /opt/flipnosis/digitalocean-deploy
./scripts/deploy.sh
```

### Step 2: Verify Deployment
```bash
# Check container status
docker-compose ps

# Check application health
curl http://localhost/health

# View logs
docker-compose logs -f app
```

### Step 3: Setup SSL (Optional)
```bash
# Install Certbot
apt install certbot

# Get SSL certificate
certbot certonly --standalone -d yourdomain.com

# Copy certificates
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem

# Restart nginx
docker-compose restart nginx
```

---

## 🔄 **PHASE 6: AUTOMATED DEPLOYMENTS**

### Step 1: Setup GitHub Actions
Create `.github/workflows/digitalocean-deploy.yml`:

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to DigitalOcean
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.DIGITALOCEAN_HOST }}
        username: ${{ secrets.DIGITALOCEAN_USER }}
        key: ${{ secrets.DIGITALOCEAN_SSH_KEY }}
        script: |
          cd /opt/flipnosis
          git pull origin main
          cd digitalocean-deploy
          ./scripts/deploy.sh
```

### Step 2: Add GitHub Secrets
- `DIGITALOCEAN_HOST`: Your droplet IP
- `DIGITALOCEAN_USER`: root
- `DIGITALOCEAN_SSH_KEY`: Your private SSH key

---

## 🧪 **PHASE 7: TESTING & OPTIMIZATION**

### Step 1: Functional Testing
- [ ] Game creation works
- [ ] Offer system functions
- [ ] Payment flow works
- [ ] Coin flip animations
- [ ] WebSocket connections
- [ ] Database persistence

### Step 2: Performance Testing
- [ ] Page load times < 2 seconds
- [ ] WebSocket latency < 50ms
- [ ] Database query performance
- [ ] Concurrent user handling

### Step 3: Security Testing
- [ ] SSL certificate valid
- [ ] Firewall rules working
- [ ] Rate limiting active
- [ ] Database access secure

---

## 📊 **MONITORING & MAINTENANCE**

### Daily Tasks
```bash
# Check application health
curl https://yourdomain.com/health

# View recent logs
docker-compose logs --tail=100 app

# Check disk space
df -h
```

### Weekly Tasks
```bash
# Create backup
cd /opt/flipnosis/digitalocean-deploy
./scripts/backup.sh

# Update system
apt update && apt upgrade -y

# Clean up Docker
docker system prune -f
```

### Monthly Tasks
```bash
# Review logs for issues
# Check database performance
# Update SSL certificates
# Review costs and usage
```

---

## 💰 **COST ANALYSIS**

### 60-Day Free Trial
- **Month 1**: $0 (covered by $200 credit)
- **Month 2**: $0 (covered by $200 credit)
- **Total**: $0 for 60 days

### After Trial (Production)
- **Droplet**: $40/month
- **Database**: $15/month
- **Backups**: $8/month
- **Bandwidth**: $20-40/month
- **Total**: $83-103/month

### Cost Comparison
- **Railway**: $600-2,400/year
- **DigitalOcean**: $996-1,236/year
- **Savings**: 40-83% cheaper

---

## 🚨 **TROUBLESHOOTING**

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker-compose logs app

# Check environment variables
docker-compose config

# Restart containers
docker-compose restart
```

#### Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check firewall rules
# Verify database credentials
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Renew certificate
certbot renew
```

---

## 📞 **SUPPORT & NEXT STEPS**

### Immediate Actions
1. ✅ Create DigitalOcean account
2. ✅ Deploy droplet and database
3. ✅ Configure environment
4. ✅ Deploy application
5. 🚨 **FIX SSL CERTIFICATE ISSUE** ← CURRENT TASK
6. ✅ Test functionality
7. ✅ Setup monitoring

### Future Enhancements
- [ ] Load balancer for scaling
- [ ] CDN for static assets
- [ ] Automated backups to cloud storage
- [ ] Advanced monitoring with Grafana
- [ ] CI/CD pipeline optimization

---

## 🎯 **SUCCESS CRITERIA**

### Technical
- [ ] Application deploys successfully
- [ ] Database connects and works
- [ ] SSL certificate valid
- [ ] WebSocket connections stable
- [ ] Performance meets requirements

### Business
- [ ] 60 days free hosting
- [ ] Cost-effective long-term solution
- [ ] Professional infrastructure
- [ ] Easy maintenance and updates

---

**🎉 Ready to start your DigitalOcean migration! Follow this guide step by step, and you'll have a professional, cost-effective hosting solution for your NFT flip game.**
