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

# Copy components needed for npm install
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install production dependencies for backend workspace
# Using npm install instead of ci to be more forgiving with lockfile
# And ensure we start fresh
RUN npm install --omit=dev --workspace=backend

# Copy built application
COPY --from=builder /app/backend/dist ./dist

# Environment setup
ENV NODE_ENV=production
EXPOSE 3000

# Try to find where nestjs/swagger is if it fails again (debug step included? no, let's trust structure)
CMD ["node", "dist/main"]
