# Use Node.js 20 (fixes the Solana package engine warnings)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for sqlite3 and other native modules
RUN apk add --no-cache python3 make g++ sqlite curl

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install dependencies (use install instead of ci for more flexibility)
RUN npm install --omit=dev

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port (Railway will provide PORT env var)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "run", "start"] 