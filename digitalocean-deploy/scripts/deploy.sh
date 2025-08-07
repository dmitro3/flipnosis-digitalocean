#!/bin/bash

# DigitalOcean Deployment Script for Flipnosis
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting Flipnosis DigitalOcean Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Please run this script from the digitalocean-deploy directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Please copy env-template.txt to .env and configure your environment variables."
    exit 1
fi

# Load environment variables
print_status "Loading environment variables..."
source .env

# Check required environment variables
required_vars=("DATABASE_URL" "CONTRACT_ADDRESS" "CONTRACT_OWNER_KEY" "RPC_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set."
        exit 1
    fi
done

print_success "Environment variables loaded successfully."

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p uploads logs/nginx database

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Remove old images to free up space
print_status "Cleaning up old Docker images..."
docker system prune -f || true

# Build and start containers
print_status "Building and starting containers..."
docker-compose up -d --build

# Wait for containers to be healthy
print_status "Waiting for containers to be healthy..."
sleep 30

# Check container health
print_status "Checking container health..."
if docker-compose ps | grep -q "Up"; then
    print_success "All containers are running!"
else
    print_error "Some containers failed to start. Check logs with: docker-compose logs"
    exit 1
fi

# Test application health
print_status "Testing application health..."
for i in {1..10}; do
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_success "Application is healthy and responding!"
        break
    else
        print_warning "Application not ready yet, retrying in 10 seconds... (attempt $i/10)"
        sleep 10
    fi
done

if [ $i -eq 10 ]; then
    print_error "Application failed to become healthy. Check logs with: docker-compose logs app"
    exit 1
fi

# Setup SSL certificates (if using Let's Encrypt)
if [ "$ENABLE_SSL" = "true" ]; then
    print_status "Setting up SSL certificates..."
    if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
        print_warning "SSL certificates not found. Please add your SSL certificates to nginx/ssl/ directory."
        print_warning "For Let's Encrypt, you can use certbot: certbot certonly --standalone -d yourdomain.com"
    else
        print_success "SSL certificates found and configured."
    fi
fi

# Setup database (if needed)
print_status "Setting up database..."
# Add database migration commands here if needed

# Final health check
print_status "Performing final health check..."
if curl -f https://localhost/health > /dev/null 2>&1 || curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "🎉 Deployment completed successfully!"
    print_success "Your Flipnosis application is now running on DigitalOcean!"
    print_status "Application URL: http://localhost (or your domain)"
    print_status "Health check: http://localhost/health"
    print_status "To view logs: docker-compose logs -f"
    print_status "To stop: docker-compose down"
else
    print_error "Final health check failed. Please check the application logs."
    exit 1
fi

print_success "Deployment script completed!"
