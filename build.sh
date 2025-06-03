#!/bin/bash

echo "🚀 Starting Railway build process..."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm ci

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server && npm ci && cd ..

# Build the frontend
echo "🏗️ Building frontend..."
npm run build

# Copy server files to dist directory
echo "📁 Copying server files..."
mkdir -p dist/server
cp server/server.js dist/server/
cp server/package.json dist/server/

echo "✅ Build complete!" 