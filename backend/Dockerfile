# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy backend package files to backend directory (needed for workspace linkage)
COPY backend/package*.json ./backend/

# Copy frontend package files (needed to satisfy workspace references in package-lock.json)
COPY frontend/package*.json ./frontend/

# Install dependencies for all workspaces (including devDeps for build tools)
RUN npm ci --include=dev

# Copy backend source code
COPY backend ./backend

# Build only the backend workspace
RUN npm run build --workspace=backend

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built assets from builder (adjust path for monorepo structure)
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/package*.json ./

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "dist/main"]
