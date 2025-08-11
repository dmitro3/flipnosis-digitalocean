# Hetzner Migration Plan - Separated Database Architecture

## Overview
Migrate from DigitalOcean to Hetzner Cloud with separated database and application servers for better scalability and maintenance.

## Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   App Server    │    │  Database       │    │   Cloudflare    │
│   (Hetzner)     │◄──►│  (Hetzner)      │    │   CDN/Load      │
│   - Node.js     │    │  - PostgreSQL   │    │   Balancer      │
│   - Static      │    │  - User Data    │    │   - SSL         │
│   - Game Logic  │    │  - XP/Profiles  │    │   - DDoS        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Server Specifications

### Database Server (Hetzner CX21)
- **Location**: Germany (Falkenstein) - closest to Ireland
- **Specs**: 4GB RAM, 2 vCPU, 40GB SSD
- **Cost**: €5.83/month (~$6.40)
- **Purpose**: PostgreSQL database, user profiles, XP data

### Application Server (Hetzner CX21)
- **Location**: Germany (Falkenstein) - same as DB
- **Specs**: 4GB RAM, 2 vCPU, 40GB SSD
- **Cost**: €5.83/month (~$6.40)
- **Purpose**: Node.js app, static files, game logic

### Total Monthly Cost: €11.66 (~$12.80)
**Savings vs DigitalOcean**: ~40-50% cheaper

## Migration Steps

### Phase 1: Database Migration
1. Set up PostgreSQL server on Hetzner
2. Export current SQLite data
3. Import to PostgreSQL
4. Test database connectivity

### Phase 2: Application Migration
1. Set up Node.js server on Hetzner
2. Update database connection strings
3. Deploy application
4. Test functionality

### Phase 3: DNS & CDN Setup
1. Configure Cloudflare CDN
2. Update DNS records
3. Enable SSL certificates
4. Test global performance

### Phase 4: Monitoring & Optimization
1. Set up monitoring tools
2. Configure backups
3. Optimize performance
4. Test failover scenarios

## Benefits of Separated Architecture

### Database Benefits
- **Independent scaling**: Scale DB separately from app
- **Better backups**: Dedicated backup strategies
- **Security**: Isolated database access
- **Performance**: Optimized database server

### Application Benefits
- **Zero-downtime deployments**: Update app without touching DB
- **Rollback capability**: Easy to revert app changes
- **Testing**: Can test new versions without affecting production data
- **Scaling**: Can add more app servers if needed

### Maintenance Benefits
- **Database updates**: Don't affect game functionality
- **Game updates**: Don't risk user data
- **Backup strategies**: Different schedules for each component
- **Security patches**: Apply independently

## Risk Mitigation

### Data Safety
- **Daily automated backups** of database
- **Point-in-time recovery** capability
- **Cross-region backups** for disaster recovery

### Application Safety
- **Blue-green deployments** for zero downtime
- **Rollback procedures** for quick recovery
- **Health monitoring** for early problem detection

### Network Safety
- **Load balancer** for traffic distribution
- **DDoS protection** via Cloudflare
- **SSL termination** at CDN level

## Cost Comparison

| Component | DigitalOcean | Hetzner | Savings |
|-----------|--------------|---------|---------|
| App Server | $24/month | €5.83/month | 76% |
| Database | $24/month | €5.83/month | 76% |
| Storage | $10/month | €2/month | 80% |
| Bandwidth | $20/month | Free | 100% |
| **Total** | **$78/month** | **€11.66/month** | **85%** |

## Next Steps
1. Create Hetzner account and get €20 free credit
2. Set up database server
3. Migrate data
4. Set up application server
5. Configure Cloudflare
6. Test thoroughly
7. Switch DNS
8. Monitor performance
