# 🚀 Hetzner Migration Checklist

## Phase 1: Account Setup ✅
- [ ] Create Hetzner account at https://console.hetzner.cloud/
- [ ] Verify email and add payment method
- [ ] Get €20 free credit
- [ ] Note: This gives you 1-2 months free hosting!

## Phase 2: Create Servers ✅
- [ ] Create Database Server:
  - Location: Germany (Falkenstein)
  - Type: CX21 (4GB RAM, 2 vCPU, 40GB SSD)
  - Cost: €5.83/month
  - OS: Ubuntu 22.04 LTS
  - Name: flipnosis-db
- [ ] Create Application Server:
  - Location: Germany (Falkenstein) - same as DB
  - Type: CX21 (4GB RAM, 2 vCPU, 40GB SSD)
  - Cost: €5.83/month
  - OS: Ubuntu 22.04 LTS
  - Name: flipnosis-app
- [ ] Note down both server IP addresses

## Phase 3: Quick Migration (Recommended) ✅
- [ ] Run the quick migration script:
  ```bash
  ./hetzner-setup/quick-migrate.sh
  ```
- [ ] This will:
  - Backup your current data
  - Set up PostgreSQL database
  - Migrate all your data
  - Create deployment package
  - Give you deployment instructions

## Phase 4: Manual Setup (Alternative) ✅
If you prefer manual setup:
- [ ] SSH into database server: `ssh root@YOUR_DB_IP`
- [ ] Run database setup script
- [ ] SSH into application server: `ssh root@YOUR_APP_IP`
- [ ] Run application setup script
- [ ] Deploy your application

## Phase 5: Cloudflare Setup ✅
- [ ] Add your domain to Cloudflare
- [ ] Update nameservers at your domain registrar
- [ ] Create A record pointing to your app server IP
- [ ] Enable SSL/TLS encryption
- [ ] Enable DDoS protection
- [ ] Configure caching rules

## Phase 6: Testing & Switch ✅
- [ ] Test application on Hetzner IP
- [ ] Test all game functionality
- [ ] Test database connections
- [ ] Update DNS to point to Cloudflare
- [ ] Monitor for 24-48 hours
- [ ] Cancel DigitalOcean servers

## 💰 Cost Comparison
| Component | DigitalOcean | Hetzner | Savings |
|-----------|--------------|---------|---------|
| App Server | $24/month | €5.83/month | 76% |
| Database | $24/month | €5.83/month | 76% |
| **Total** | **$48/month** | **€11.66/month** | **85%** |

## 🚀 Benefits You'll Get
- ✅ **85% cost savings** - From $48/month to €11.66/month
- ✅ **Separated database** - Update game without touching user data
- ✅ **Better reliability** - No more random deployment issues
- ✅ **Global performance** - Cloudflare CDN for worldwide users
- ✅ **Easy scaling** - Can add more servers if needed
- ✅ **Better monitoring** - Clear visibility into deployments

## 📞 Need Help?
If you get stuck at any step:
1. Check the detailed scripts in `hetzner-setup/`
2. Look at the migration plan in `hetzner-migration-plan.md`
3. The quick migration script handles most things automatically

## 🎯 Quick Start
1. Create Hetzner account
2. Create 2 servers (CX21 each)
3. Run: `./hetzner-setup/quick-migrate.sh`
4. Follow the instructions it gives you
5. Set up Cloudflare
6. Test and switch DNS

**Total time: ~30 minutes**
**Savings: 85% cheaper hosting**
