FROM node:22-slim AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:22-slim AS production

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copy package files and install production deps
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod

# Copy built assets from build stage (client is in dist/public from Vite)
COPY --from=base /app/dist ./dist
COPY --from=base /app/drizzle ./drizzle

# App must run in production so the server uses static assets (dist/public), not Vite
ENV NODE_ENV=production

# Expose port (Railway sets PORT env var)
EXPOSE ${PORT:-3000}

# Healthcheck: use /health (not /api/trpc/auth.me). See RAILWAY.md.
# Start the application (server bundle has no vite dependency)
CMD ["node", "dist/index.js"]
