#!/bin/bash

echo "🚀 Starting Railway build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the frontend
echo "🏗️ Building frontend..."
npm run build

# Copy server files to dist directory
echo "📁 Copying server files..."
mkdir -p dist/server
cp -r server/* dist/server/

# Copy package files for production dependencies
echo "📋 Copying package files..."
cp package.json dist/
cp package-lock.json dist/

echo "✅ Build complete!"
ls -la dist/ 