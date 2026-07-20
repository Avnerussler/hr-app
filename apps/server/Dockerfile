# Multi-stage build for Node.js server
# NOTE: build context must be the monorepo root (not apps/server), since this
# is an npm workspace and needs the root lockfile + packages/shared-types.
#   docker build -f apps/server/Dockerfile -t hr-server-app .
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY apps/server apps/server
COPY packages/shared-types packages/shared-types

# Build the application
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=apps/server

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json

# Install only production dependencies
RUN npm ci --omit=dev --workspace=apps/server && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# PORT the application runs on
ENV PORT=3001
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 3001

# Start the application
CMD ["node", "apps/server/dist/server.js"]
