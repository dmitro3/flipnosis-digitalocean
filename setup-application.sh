#!/bin/bash
set -e
echo "Setting up application server..."
apt-get update
apt-get install -y docker.io docker-compose nginx
systemctl start docker
systemctl enable docker
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "Application server setup complete!"
