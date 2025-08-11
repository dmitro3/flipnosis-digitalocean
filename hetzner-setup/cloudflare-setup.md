# Cloudflare CDN Setup for Hetzner Deployment

## Overview
Configure Cloudflare CDN to work with your Hetzner deployment for better global performance, SSL, and DDoS protection.

## Step 1: Create Cloudflare Account

1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up for a free account
3. Add your domain: `flipnosis.fun`

## Step 2: Configure DNS Records

### Update DNS Records in Cloudflare:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| A | @ | YOUR_HETZNER_APP_IP | Proxied (Orange Cloud) |
| A | www | YOUR_HETZNER_APP_IP | Proxied (Orange Cloud) |
| CNAME | api | flipnosis.fun | Proxied (Orange Cloud) |

### Important Notes:
- **Enable Proxy** (Orange Cloud) for all records
- This routes traffic through Cloudflare's global network
- Provides DDoS protection and caching

## Step 3: SSL/TLS Configuration

### SSL/TLS Settings:
1. Go to **SSL/TLS** → **Overview**
2. Set **Encryption mode** to: **Full (strict)**
3. Enable **Always Use HTTPS**
4. Enable **Minimum TLS Version**: **1.2**

### Edge Certificates:
1. Go to **SSL/TLS** → **Edge Certificates**
2. Enable **Always Use HTTPS**
3. Enable **Automatic HTTPS Rewrites**
4. Set **TLS 1.3** to **Enabled**
5. Set **Opportunistic Encryption** to **Enabled**

## Step 4: Performance Optimization

### Caching Configuration:
1. Go to **Caching** → **Configuration**
2. Set **Browser Cache TTL** to **4 hours**
3. Enable **Always Online**
4. Set **Development Mode** to **Off** (for production)

### Page Rules (Optional):
Create page rules for better caching:

| URL Pattern | Settings |
|-------------|----------|
| `flipnosis.fun/api/*` | Cache Level: Bypass |
| `flipnosis.fun/ws` | Cache Level: Bypass |
| `flipnosis.fun/*.js` | Cache Level: Cache Everything, Edge Cache TTL: 1 year |
| `flipnosis.fun/*.css` | Cache Level: Cache Everything, Edge Cache TTL: 1 year |
| `flipnosis.fun/images/*` | Cache Level: Cache Everything, Edge Cache TTL: 1 month |

## Step 5: Security Settings

### Security Level:
1. Go to **Security** → **Settings**
2. Set **Security Level** to **Medium**
3. Enable **Browser Integrity Check**

### Rate Limiting:
1. Go to **Security** → **Rate Limiting**
2. Create rules for API protection:
   - **Expression**: `(http.request.uri.path contains "/api/")`
   - **Rate**: 10 requests per 10 seconds
   - **Action**: Block

### WAF (Web Application Firewall):
1. Go to **Security** → **WAF**
2. Enable **Managed Rules**
3. Set **Security Level** to **Medium**

## Step 6: Network Optimization

### Network Settings:
1. Go to **Speed** → **Optimization**
2. Enable **Auto Minify** for JavaScript, CSS, and HTML
3. Enable **Brotli** compression
4. Enable **Rocket Loader**

### Argo (Optional - Paid):
If you have Argo enabled:
1. Go to **Speed** → **Argo**
2. Enable **Argo** for better routing

## Step 7: Monitoring & Analytics

### Analytics:
1. Go to **Analytics** → **Overview**
2. Monitor traffic patterns
3. Check performance metrics

### Logs (Optional - Paid):
If you have Logs enabled:
1. Go to **Logs** → **Analytics**
2. Monitor real-time traffic
3. Set up alerts for unusual activity

## Step 8: Hetzner Server Configuration

### Update Nginx Configuration:
Make sure your Hetzner server's nginx.conf includes Cloudflare headers:

```nginx
# Add to your nginx server block
location / {
    # Trust Cloudflare's real IP
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    real_ip_header CF-Connecting-IP;
    
    # Your existing configuration...
}
```

## Step 9: Testing

### Test Checklist:
- [ ] Website loads correctly
- [ ] SSL certificate is valid
- [ ] Static assets are cached
- [ ] API calls work properly
- [ ] WebSocket connections work
- [ ] Performance is improved
- [ ] DDoS protection is active

### Performance Testing:
1. Use [GTmetrix](https://gtmetrix.com) to test loading speed
2. Use [Pingdom](https://tools.pingdom.com) to test from different locations
3. Monitor Cloudflare analytics for performance metrics

## Step 10: Monitoring & Maintenance

### Regular Checks:
- Monitor Cloudflare analytics weekly
- Check SSL certificate status monthly
- Review security events regularly
- Update page rules as needed

### Troubleshooting:
- If site is slow: Check Cloudflare cache settings
- If SSL errors: Verify SSL/TLS configuration
- If API issues: Check rate limiting rules
- If DDoS attacks: Monitor security events

## Benefits You'll Get:

### Performance:
- **30-50% faster loading** for global users
- **Reduced server load** through caching
- **Better compression** with Brotli

### Security:
- **DDoS protection** included
- **SSL certificates** managed automatically
- **WAF protection** against attacks

### Reliability:
- **Global CDN** with 200+ locations
- **Automatic failover** if server goes down
- **Always Online** feature for cached content

## Cost:
- **Free tier**: Includes all basic features
- **Pro tier** ($20/month): Advanced features like page rules
- **Business tier** ($200/month): Advanced security features

For your use case, the **free tier** should be sufficient to start with.
