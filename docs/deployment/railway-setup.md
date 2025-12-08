# Railway Deployment Setup Guide

## Overview

This guide walks you through deploying the Közlekedési Jegykezelő backend API to Railway.

**Platform:** Railway
**Application:** Backend (NestJS)
**URL Structure:** `https://your-app.up.railway.app`

## Prerequisites

- [ ] Railway account (sign up at https://railway.app/)
- [ ] GitHub repository access
- [ ] Supabase project configured with Service Role Key
- [ ] Backend application running locally

## Why Railway?

- Easy deployment from GitHub
- Automatic HTTPS
- Environment variable management
- Generous free tier
- Built-in monitoring
- PostgreSQL addon (if needed)

## Deployment Methods

### Method 1: GitHub Integration (Recommended)

Automatically deploys on every push to your repository.

#### Step 1: Create Railway Project

1. Log in to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select repository: `szakdolgozat/kozlekedesi-jegykezelo`

#### Step 2: Configure Project

Railway will auto-detect the Node.js project.

**Root Directory:**
```
backend
```

**Build Command:**
```bash
npm run build
```

**Start Command:**
```bash
npm run start:prod
```

#### Step 3: Set Environment Variables

In Railway Dashboard → **Variables** tab:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Application port |
| `SUPABASE_URL` | `https://prhlsuwkokuisqavwfoi.supabase.co` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `your-anon-key` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | **IMPORTANT: Get from Supabase Dashboard** |
| `JWT_SECRET` | `generate-random-string` | JWT signing secret |
| `CORS_ORIGIN` | `https://your-app.netlify.app` | Frontend URL for CORS |

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Get Supabase Service Role Key:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select project: **kozlekedesi-jegykezelo**
3. Navigate to **Project Settings** → **API**
4. Copy **service_role** key (NOT anon key)
5. **NEVER commit this to git!**

#### Step 4: Configure Build Settings

In Railway Dashboard → **Settings** tab:

**Root Directory:**
```
backend
```

**Build Command (optional override):**
```bash
npm ci && npm run build
```

**Start Command:**
```bash
node dist/main.js
```

**Watch Paths (optional):**
```
backend/**
```

#### Step 5: Deploy

1. Click **"Deploy"** button
2. Railway will:
   - Clone the repository
   - Install dependencies
   - Build the application
   - Start the server
3. Wait for deployment to complete (~2-3 minutes)
4. Railway assigns a URL: `https://your-app.up.railway.app`

#### Step 6: Enable Public Domain

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Railway creates: `your-app.up.railway.app`
4. Add custom domain (optional):
   - Click **"Custom Domain"**
   - Enter your domain
   - Configure DNS as instructed

### Method 2: Railway CLI Deployment

For manual deployments and local testing.

#### Step 1: Install Railway CLI

**macOS/Linux:**
```bash
curl -fsSL https://railway.app/install.sh | sh
```

**Windows:**
```bash
npm install -g @railway/cli
```

#### Step 2: Login to Railway

```bash
railway login
```

#### Step 3: Initialize Project

```bash
cd backend
railway init
```

Follow prompts:
- Create new project or link existing
- Choose team
- Set project name

#### Step 4: Deploy

```bash
# Deploy from current directory
railway up

# Deploy specific directory
railway up --service backend
```

#### Step 5: View Logs

```bash
railway logs
```

### Method 3: Dockerfile Deployment (Advanced)

For more control over the deployment environment.

#### Step 1: Create Dockerfile

Create `backend/Dockerfile`:

```dockerfile
# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main.js"]
```

#### Step 2: Create .dockerignore

Create `backend/.dockerignore`:

```
node_modules
dist
npm-debug.log
.env
.env.*
.git
.gitignore
README.md
coverage
.vscode
.idea
```

#### Step 3: Deploy with Dockerfile

Railway will auto-detect the Dockerfile and use it for deployment.

## Configuration

### Environment Variables Best Practices

#### Required Variables

```env
# Application
NODE_ENV=production
PORT=3000

# Supabase
SUPABASE_URL=https://prhlsuwkokuisqavwfoi.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT
JWT_SECRET=your-random-secret-here

# CORS
CORS_ORIGIN=https://your-frontend-url.netlify.app
```

#### Optional Variables

```env
# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=100

# Database Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Railway Configuration File

Create `railway.json` in backend directory (optional):

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci && npm run build"
  },
  "deploy": {
    "startCommand": "node dist/main.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Health Checks

### Implement Health Check Endpoint

Add to NestJS backend:

**File:** `backend/src/health/health.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };
  }
}
```

Railway will automatically monitor this endpoint.

## Monitoring & Logging

### View Logs

**Railway Dashboard:**
- Go to **Deployments** tab
- Click on a deployment
- View real-time logs

**Railway CLI:**
```bash
# View logs
railway logs

# Follow logs (tail -f)
railway logs -f

# Filter logs
railway logs --filter "ERROR"
```

### Metrics

Railway provides built-in metrics:
- CPU usage
- Memory usage
- Network traffic
- Request count
- Response times

Access via **Metrics** tab in Railway Dashboard.

### Error Tracking

Integrate Sentry or similar (optional):

```bash
npm install @sentry/node @sentry/tracing
```

Configure in `main.ts`:

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## Scaling & Performance

### Vertical Scaling

Railway automatically scales resources based on usage.

**Free Tier Limits:**
- 512 MB RAM
- 1 vCPU
- 5 GB bandwidth/month
- $5 free credit/month

**Upgrade to Pro:**
- More resources
- Custom domains
- Team collaboration

### Horizontal Scaling

Not available on Railway free tier. For horizontal scaling, consider:
- Kubernetes
- AWS ECS
- Google Cloud Run

## Database Integration

### Option 1: Continue Using Supabase

Keep using Supabase PostgreSQL (current setup):
- No changes needed
- Connection via Supabase client
- Built-in auth integration

### Option 2: Railway PostgreSQL Plugin

If you need a separate database:

1. Click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway creates a database and provides connection string
3. Update environment variables:

```env
DATABASE_URL=postgresql://user:pass@host:port/dbname
```

**Note:** This is NOT needed for current setup as we use Supabase.

## Security Best Practices

### 1. Secrets Management

**Never commit to git:**
- `.env` files
- Service role keys
- JWT secrets
- Database passwords

**Use Railway Variables:**
All secrets are encrypted in Railway.

### 2. CORS Configuration

Update `backend/src/main.ts`:

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true,
});
```

### 3. Rate Limiting

Install throttler:

```bash
npm install @nestjs/throttler
```

Configure in `app.module.ts`:

```typescript
ThrottlerModule.forRoot({
  ttl: 60,
  limit: 10,
}),
```

### 4. Helmet (Security Headers)

Already included in backend:

```typescript
import helmet from 'helmet';
app.use(helmet());
```

### 5. Input Validation

Already configured with `class-validator`:

```typescript
app.useGlobalPipes(new ValidationPipe());
```

## Continuous Deployment

### Automatic Deployments

Railway automatically deploys on:
- Push to `master` branch
- Pull request merges

### Deployment Triggers

Configure in **Settings** → **Triggers**:
- Trigger on push to specific branches
- Trigger on PR creation
- Manual deployments only

### Integration with GitHub Actions

Existing workflow `.github/workflows/backend-ci.yml` runs tests before Railway deployment:

```yaml
on:
  push:
    branches: [master, develop]
    paths:
      - 'backend/**'
```

When CI passes, Railway deploys automatically.

## Rollback Procedures

### Method 1: Rollback via Dashboard

1. Go to **Deployments** tab
2. Find the last working deployment
3. Click **"Redeploy"** on that version

### Method 2: Rollback via Git

```bash
# Revert to previous commit
git revert HEAD
git push origin master

# Railway auto-deploys reverted code
```

### Method 3: Railway CLI

```bash
# View deployment history
railway status

# Rollback to specific deployment
railway rollback <deployment-id>
```

## Troubleshooting

### Issue 1: Build Fails - "Module not found"

**Solution:** Verify `package.json` includes all dependencies

```bash
cd backend
npm install
npm run build
```

### Issue 2: Application Crashes on Startup

**Solution:** Check logs for errors

```bash
railway logs -f
```

Common causes:
- Missing environment variables
- Port configuration issues
- Database connection failures

### Issue 3: Port Binding Error

**Solution:** Railway injects `PORT` environment variable. Ensure your app uses it:

```typescript
const port = process.env.PORT || 3000;
await app.listen(port);
```

### Issue 4: CORS Errors

**Solution:** Update `CORS_ORIGIN` environment variable to include frontend URL:

```env
CORS_ORIGIN=https://your-app.netlify.app
```

### Issue 5: Database Connection Timeout

**Solution:** Verify Supabase credentials and network connectivity:

```bash
# Test connection
railway run npm run start:dev
```

## Cost Information

### Free Tier Includes:
- $5 free credit/month
- 512 MB RAM
- 1 vCPU
- 5 GB bandwidth
- 1 GB disk
- Hobby plan

### Pricing:
- **Free**: $0/month - $5 credit
- **Developer**: $5/month - Usage-based
- **Team**: $20/month - Team features

**Estimated costs for this project:** $0-5/month (within free tier)

Monitor usage: **Dashboard** → **Usage**

## Railway CLI Commands Reference

```bash
# Login
railway login

# Initialize project
railway init

# Link existing project
railway link

# Deploy
railway up

# View logs
railway logs

# View logs (follow)
railway logs -f

# Run command in Railway environment
railway run <command>

# Open project in browser
railway open

# View environment variables
railway variables

# Set environment variable
railway variables set KEY=value

# Project status
railway status

# Connect to database (if using Railway PostgreSQL)
railway connect postgres
```

## Integration with Frontend

### Update Frontend Environment

**File:** `frontend/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-app.up.railway.app/api',
  supabaseUrl: 'https://prhlsuwkokuisqavwfoi.supabase.co',
  supabaseAnonKey: 'your-anon-key'
};
```

### Update CORS in Backend

```env
CORS_ORIGIN=https://your-frontend.netlify.app
```

## Support Resources

- **Railway Documentation:** https://docs.railway.app/
- **Railway Discord:** https://discord.gg/railway
- **Railway Status:** https://status.railway.app/
- **Railway Blog:** https://blog.railway.app/

## Checklist for Production Deployment

- [ ] Railway account created
- [ ] Repository connected
- [ ] Environment variables configured
- [ ] Supabase Service Role Key added (never commit!)
- [ ] JWT Secret generated and added
- [ ] CORS configured with frontend URL
- [ ] Build succeeds locally
- [ ] Deployment successful
- [ ] Health check endpoint responding
- [ ] Logs monitored for errors
- [ ] Frontend can connect to backend
- [ ] Authentication working
- [ ] Database operations working
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] Monitoring set up

---

**Last Updated:** 2025-11-04
**Maintained By:** DevOps Infrastructure Engineer
**Platform Version:** Railway v2.x
