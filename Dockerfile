# Football Stream - Docker Image
# Production-ready containerized deployment

FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 8084

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8084/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8084
ENV DATABASE_PATH=/app/data/football.db

# Start application
CMD ["node", "src/server.js"]
