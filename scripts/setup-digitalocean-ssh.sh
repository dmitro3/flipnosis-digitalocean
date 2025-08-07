#!/bin/bash

# DigitalOcean SSH Key Setup Script
# This script helps you generate and configure SSH keys for DigitalOcean deployment

echo "🔑 DigitalOcean SSH Key Setup"
echo "=============================="

# Check if SSH key already exists
if [ -f ~/.ssh/id_rsa ]; then
    echo "✅ SSH key already exists at ~/.ssh/id_rsa"
    echo "Public key:"
    cat ~/.ssh/id_rsa.pub
    echo ""
    echo "Copy this public key to your DigitalOcean droplet's ~/.ssh/authorized_keys"
else
    echo "🔧 Generating new SSH key..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
    echo "✅ SSH key generated!"
    echo "Public key:"
    cat ~/.ssh/id_rsa.pub
    echo ""
    echo "Copy this public key to your DigitalOcean droplet's ~/.ssh/authorized_keys"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Copy the public key above to your DigitalOcean droplet"
echo "2. Add the private key content to GitHub Secrets as DIGITALOCEAN_SSH_KEY"
echo "3. To get the private key content, run: cat ~/.ssh/id_rsa"
echo ""
echo "🔧 To copy public key to DigitalOcean droplet:"
echo "ssh-copy-id root@your-droplet-ip"
echo ""
echo "📝 To add private key to GitHub Secrets:"
echo "1. Go to your GitHub repository"
echo "2. Settings → Secrets and variables → Actions"
echo "3. Add new secret: DIGITALOCEAN_SSH_KEY"
echo "4. Paste the content of: cat ~/.ssh/id_rsa"
