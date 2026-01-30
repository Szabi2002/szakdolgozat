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

# Copy backend package files as if it were a standalone app
# We rename them to remove the monorepo context completely
COPY backend/package*.json ./

# Install production dependencies using the backend's package.json
# Since we are now "root", we don't need --workspace flags
RUN npm install --omit=dev

# Copy built application
COPY --from=builder /app/backend/dist ./dist

# Environment setup
ENV NODE_ENV=production
# Remove NODE_PATH hack as it shouldn't be needed with flat install
# ENV NODE_PATH=./node_modules 
EXPOSE 3000

CMD ["node", "dist/main"]
