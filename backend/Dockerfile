# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Install dependencies needed for build
RUN npm ci

COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Set environment to production
ENV NODE_ENV=production

# Expose port (Koyeb detects this, but good to have)
EXPOSE 3000

# Start command
CMD ["npm", "run", "start:prod"]
