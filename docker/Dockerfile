# AgentGatePay Transaction Signing Service - Docker Image
# Production-ready multi-stage build for Docker Hub
#
# Build from TX repo root:
#   docker build -f docker/Dockerfile -t agentgatepay/tx-signing-service:latest .
#
# The service files are in tx-signing-service/ directory

# Stage 1: Dependencies
FROM node:18-alpine AS deps

WORKDIR /app

# Copy package files from tx-signing-service directory
COPY tx-signing-service/package*.json ./

# Install production dependencies only
RUN npm install --only=production --ignore-scripts

# Stage 2: Production image
FROM node:18-alpine

# Metadata
LABEL maintainer="AgentGatePay <support@agentgatepay.com>"
LABEL description="Secure transaction signing service for autonomous AI agent payments"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/AgentGatePay/TX"

WORKDIR /app

# Copy dependencies from builder stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application files from tx-signing-service directory
COPY tx-signing-service/index.js ./
COPY tx-signing-service/package.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S agentpay && \
    adduser -S agentpay -u 1001 -G agentpay && \
    chown -R agentpay:agentpay /app

# Switch to non-root user
USER agentpay

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start service
CMD ["node", "index.js"]
