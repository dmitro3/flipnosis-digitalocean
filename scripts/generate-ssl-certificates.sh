#!/bin/bash

# Generate SSL certificates for CryptoFlipz server
# This script creates self-signed certificates for development/testing

echo "🔐 Generating SSL certificates for CryptoFlipz..."

# Create SSL directory if it doesn't exist
sudo mkdir -p /etc/ssl/private
sudo mkdir -p /etc/ssl/certs

# Generate self-signed certificate
echo "📝 Generating self-signed certificate..."
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/selfsigned.key \
  -out /etc/ssl/certs/selfsigned.crt \
  -subj "/C=US/ST=State/L=City/O=CryptoFlipz/CN=flipnosis.fun"

# Set proper permissions
sudo chmod 600 /etc/ssl/private/selfsigned.key
sudo chmod 644 /etc/ssl/certs/selfsigned.crt

echo "✅ SSL certificates generated successfully!"
echo "📁 Key: /etc/ssl/private/selfsigned.key"
echo "📁 Cert: /etc/ssl/certs/selfsigned.crt"
echo ""
echo "🔧 Next steps:"
echo "1. Restart your server to enable HTTPS/WSS"
echo "2. The server will automatically detect the certificates"
echo "3. WSS connections will be available on port 443"
