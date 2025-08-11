# 🌐 Domain Setup Guide for Flipnosis.fun

## 📋 Prerequisites
- GoDaddy domain: `www.flipnosis.fun`
- DigitalOcean droplet IP: `143.198.166.196`
- Access to GoDaddy DNS settings

## 🔧 Step 1: Configure GoDaddy DNS

1. **Login to GoDaddy** and go to your domain management
2. **Navigate to DNS settings** for `flipnosis.fun`
3. **Add/Update these DNS records:**

```
Type: A
Name: @ (or leave blank)
Value: 143.198.166.196
TTL: 600 (or default)

Type: A  
Name: www
Value: 143.198.166.196
TTL: 600 (or default)
```

4. **Save the changes** and wait 5-10 minutes for propagation

## 🚀 Step 2: Deploy with SSL Setup

### Option A: Manual Deployment (Recommended for first time)

1. **SSH into your DigitalOcean droplet:**
```bash
ssh root@143.198.166.196
```

2. **Navigate to your project:**
```bash
cd /root/flipnosis-digitalocean
```

3. **Pull latest changes:**
```bash
git pull origin main
```

4. **Make SSL script executable:**
```bash
chmod +x digitalocean-deploy/scripts/setup-ssl.sh
```

5. **Run SSL setup (replace with your email):**
```bash
cd digitalocean-deploy
./scripts/setup-ssl.sh www.flipnosis.fun your-email@example.com
```

6. **Deploy the application:**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Option B: GitHub Actions Deployment

The GitHub Actions workflow will automatically deploy, but you'll need to run the SSL setup manually after the first deployment.

## 🔍 Step 3: Verify Setup

1. **Check if your site is accessible:**
   - https://www.flipnosis.fun
   - https://flipnosis.fun (should redirect to www)

2. **Test SSL certificate:**
   - Visit https://www.ssllabs.com/ssltest/
   - Enter your domain and check the grade

3. **Check nginx logs:**
```bash
docker-compose logs nginx
```

## 🛠️ Troubleshooting

### If SSL certificate fails:
```bash
# Check if port 80 is free
netstat -tlnp | grep :80

# Stop nginx manually
docker-compose stop nginx

# Try SSL setup again
./scripts/setup-ssl.sh www.flipnosis.fun your-email@example.com
```

### If domain doesn't resolve:
1. Check GoDaddy DNS settings
2. Wait longer for DNS propagation (up to 24 hours)
3. Test with: `nslookup www.flipnosis.fun`

### If nginx won't start:
```bash
# Check nginx configuration
docker-compose exec nginx nginx -t

# Check SSL certificate files
ls -la /etc/nginx/ssl/
```

## 🔄 Automatic Renewal

The SSL certificates will automatically renew every 60 days. The renewal script is installed at `/etc/cron.d/ssl-renewal`.

## 📞 Support

If you encounter issues:
1. Check the nginx logs: `docker-compose logs nginx`
2. Check the app logs: `docker-compose logs app`
3. Verify DNS propagation: https://www.whatsmydns.net/

## 🎯 Expected Result

After successful setup:
- ✅ https://www.flipnosis.fun loads your app
- ✅ http://www.flipnosis.fun redirects to https
- ✅ SSL certificate is valid and secure
- ✅ WebSocket connections work over WSS
- ✅ All game functionality works properly
