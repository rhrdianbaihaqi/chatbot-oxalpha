# Use the official Bun image
# See all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1.1.27-alpine AS base
WORKDIR /app

# Stage 1: Build the frontend
FROM base AS builder
COPY . .
# Install all dependencies (frontend + backend) to build the frontend
RUN bun install
RUN cd frontend && bun run build

# Stage 2: Install production backend dependencies
FROM base AS prod-deps
COPY backend/package.json backend/bun.lock* ./backend/
# We also copy root package.json if it exists to maintain workspace context
COPY package.json bun.lock* ./
RUN bun install --production --cwd backend

# Stage 3: Runner
FROM base AS runner
# Copy built frontend
COPY --from=builder /app/frontend/dist ./frontend/dist
# Copy backend files and prod dependencies
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Run the Elysia server
WORKDIR /app/backend
CMD ["bun", "src/index.ts"]
