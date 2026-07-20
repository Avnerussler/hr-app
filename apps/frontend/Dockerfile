# Multi-stage build for React frontend
# NOTE: build context must be the monorepo root (not apps/frontend), since this
# is an npm workspace and needs the root lockfile + packages/shared-types.
#   docker build -f apps/frontend/Dockerfile -t hr-frontend-app .
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/frontend apps/frontend
COPY packages/shared-types packages/shared-types

# Accept build-time environment variables
ARG VITE_BASE_URL
ENV VITE_BASE_URL=$VITE_BASE_URL

# Build the application
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=apps/frontend

# Production stage with nginx
FROM nginx:stable-alpine AS production

# Copy built application from builder stage
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY apps/frontend/nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
