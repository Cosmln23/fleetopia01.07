# Multi-stage Dockerfile for Next.js with proper build/runtime separation
FROM node:18-alpine AS dependencies

# Install dependencies
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/start-selector.js ./start-selector.js
COPY --from=builder /app/run-cron.js ./run-cron.js
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/database ./database

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Use start-selector for runtime (NOT build time)
CMD ["npm", "start"] 