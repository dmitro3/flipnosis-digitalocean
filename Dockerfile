# Use Node.js 20
FROM node:20

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first
COPY package*.json ./

# NUCLEAR FIX: Delete node_modules and package-lock.json, then reinstall
# This is exactly what the error message suggests
RUN rm -rf node_modules package-lock.json || true

# Install npm latest version to fix the optional dependencies bug
RUN npm install -g npm@latest

# Fresh install with force clean
RUN npm cache clean --force
RUN npm install --no-optional

# Explicitly install the rollup binary that's missing
RUN npm install @rollup/rollup-linux-x64-gnu --save-dev

# Copy source code
COPY . .

# Build the frontend with verbose logging
RUN npm run build -- --logLevel info

# Create a non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "run", "start"] 